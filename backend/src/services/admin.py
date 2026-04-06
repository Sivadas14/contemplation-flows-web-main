from tuneapi import tu

from fastapi import Depends, Query, HTTPException,UploadFile
from uuid import UUID
from supabase import Client
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import  UploadFile, File, Depends, HTTPException
from supabase import Client
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from uuid import uuid4
from typing import List


from src.db import get_db_session_fa, SourceDocument as DBSourceDocument
from src.settings import get_supabase_client
from src import wire as w


from src.db import (
    get_db_session_fa,
    UserProfile as DBUserProfile,
    SourceDocument as DBSourceDocument,
    ContentGeneration,
    Message,
    Conversation,
    ContentType,
    DocumentStatus,
    Subscription
)
from src import wire as w
from src.dependencies import get_current_user
from src.settings import get_supabase_client, get_supabase_admin_client, get_llm
from src.chunking import extract_pdf_text
from src.db import DocumentChunk


# ============================================================================
# 1. USER MANAGEMENT
# ============================================================================


from src.services.usage import get_usage, calculate_conversation_usage

async def list_users(
    limit: int = Query(50, le=100),
    skip: int = Query(0, ge=0),
    search_term: str | None = Query(None),
    session: AsyncSession = Depends(get_db_session_fa),
) -> w.ListUsersResponse:
    """GET /api/admin/users - List all users with filtering (lightweight) and pagination"""

    # Build the base query
    query = select(DBUserProfile)
    count_query = select(func.count()).select_from(DBUserProfile)

    # Apply filters: Search in name, phone, or email
    if search_term:
        search_filter = or_(
            DBUserProfile.name.ilike(f"%{search_term}%"),
            DBUserProfile.phone_number.ilike(f"%{search_term}%"),
            DBUserProfile.email_id.ilike(f"%{search_term}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    total_count_result = await session.execute(count_query)
    total_count = total_count_result.scalar_one()

    # Apply limit, offset and order by creation date (newest first)
    query = query.order_by(DBUserProfile.created_at.desc()).offset(skip).limit(limit)

    # Execute query
    result = await session.execute(query)
    db_users: list[DBUserProfile] = result.scalars().all()

    # create wire users
    wire_users = []

    for user in db_users:
        # Get basic wire model
        wire_user = await user.to_bm()
        
        # Get subscription status
        sub_query = (
            select(Subscription)
            .where(Subscription.user_id == user.id)
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        sub_result = await session.execute(sub_query)
        latest_sub = sub_result.scalar_one_or_none()
        subscription_status = latest_sub.status.value if latest_sub else "No Subscription"

        # Simplified UserListItem
        wire_users.append(
            w.UserListItem(
                **wire_user.model_dump(),
                subscription_status=subscription_status,
            )
        )
    return w.ListUsersResponse(users=wire_users, total_count=total_count)


async def get_user_admin_details(
    user_id: str,
    session: AsyncSession = Depends(get_db_session_fa),
) -> w.UserWithUsage:
    """GET /api/admin/users/{user_id} - Get full details for a single user"""

    # Validate UUID format
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Get the user
    query = select(DBUserProfile).where(DBUserProfile.id == user_uuid)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get basic wire model
    wire_user = await user.to_bm()

    # Get subscription status
    sub_query = (
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    sub_result = await session.execute(sub_query)
    latest_sub = sub_result.scalar_one_or_none()
    subscription_status = latest_sub.status.value if latest_sub else "No Subscription"

    # Get full usage details (HEAVY)
    try:
        quota_details = await get_usage(current_user=user, session=session)
    except Exception as e:
        tu.logger.error(f"Failed to get usage for user {user.id}: {e}")
        quota_details = None

    # Calculate legacy usage_stats (HEAVY)
    conversations_count = await calculate_conversation_usage(user.id, session)
    
    content_generations_query = await session.execute(
        select(ContentGeneration).where(ContentGeneration.user_id == user.id)
    )
    content_generations = content_generations_query.scalars().all()

    return w.UserWithUsage(
        **wire_user.model_dump(),
        subscription_status=subscription_status,
        quota_details=quota_details,
        usage_stats={
            "conversations": conversations_count,
            "content_generations": {
                "total": len(content_generations),
                "video": len([c for c in content_generations if c.content_type == ContentType.VIDEO]),
                "audio": len([c for c in content_generations if c.content_type == ContentType.AUDIO]),
                "image": len([c for c in content_generations if c.content_type == ContentType.IMAGE]),
            },
        },
    )


async def delete_user(
    user_id: str,
    current_user: DBUserProfile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session_fa),
    spb_client: Client = Depends(get_supabase_client),
    spb_admin: Client = Depends(get_supabase_admin_client),
) -> w.SuccessResponse:
    """DELETE /api/admin/users/{id} - Delete user and all data"""

    # Validate UUID format
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Check if user exists
    query = select(DBUserProfile).where(DBUserProfile.id == user_uuid)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # Log the deletion for audit purposes
    tu.logger.info(
        f"Admin {current_user.id} deleting user {user.id} ({user.phone_number})"
    )

    # delete content generations
    content_generations = await session.execute(
        select(ContentGeneration).where(ContentGeneration.user_id == user.id)
    )
    content_generations = content_generations.scalars().all()
    if content_generations:
        for content_generation in content_generations:
            if content_generation.content_path:
                spb_client.storage.from_("generations").remove(
                    [content_generation.content_path]
                )
                tu.logger.info(
                    f"Deleted file from storage: {content_generation.content_path}"
                )
            await session.delete(content_generation)

    # Delete from Supabase Auth if auth_user_id exists
    if user.auth_user_id:
        try:
            spb_admin.auth.admin.delete_user(str(user.auth_user_id))
            tu.logger.info(f"Deleted user from Supabase Auth: {user.auth_user_id}")
        except Exception as e:
            tu.logger.error(f"Failed to delete user from Supabase Auth: {e}")
            # We continue even if auth deletion fails, as the DB record is the primary one we want to remove

    await session.delete(user)  # Delete the user (cascading will handle related data)

    tu.logger.info(f"Successfully deleted user {user.id} and all associated data")
    return w.SuccessResponse(
        success=True,
        message=f"User {user.phone_number} and all associated data deleted successfully",
    )

async def toggle_user_active(
    user_id: str,
    current_user: DBUserProfile = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session_fa),
) -> w.SuccessResponse:
    """PATCH /api/admin/users/{user_id}/toggle-active - Toggle user active status"""

    # Validate UUID format
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Check if user exists
    query = select(DBUserProfile).where(DBUserProfile.id == user_uuid)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating themselves
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    # Toggle active status
    user.is_active = not user.is_active
    new_status = "active" if user.is_active else "inactive"

    tu.logger.info(
        f"Admin {current_user.id} toggled user {user.id} to {new_status}"
    )

    return w.SuccessResponse(
        success=True,
        message=f"User {user.phone_number or user.email_id} is now {new_status}",
        data={"is_active": user.is_active},
    )


# ============================================================================
# 2. CONTENT GENERATION
# ============================================================================


async def delete_content(
    content_id: str,
    session: AsyncSession = Depends(get_db_session_fa),
    spb_client: Client = Depends(get_supabase_client),
) -> w.SuccessResponse:
    """DELETE /api/admin/content/{type}/{id} - Remove generated content"""

    # Validate UUID format
    try:
        content_uuid = UUID(content_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid content ID format")

    # Find the content generation record
    query = select(ContentGeneration).where(ContentGeneration.id == content_uuid)
    result = await session.execute(query)
    content: ContentGeneration | None = result.scalar_one_or_none()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Log the deletion for audit purposes
    tu.logger.info(f"Deleting {content.content_type} content {content.id}")

    # TODO: Delete associated files from Supabase storage
    if content.content_path:
        try:
            # Delete from Supabase storage
            spb_client.storage.from_("generations").remove([content.content_path])
            tu.logger.info(f"Deleted file from storage: {content.content_path}")
        except Exception as e:
            tu.logger.warning(f"Failed to delete file from storage: {e}")

    # Delete the content generation record
    await session.delete(content)
    # Note: session.commit() is handled automatically by the session dependency

    tu.logger.info(f"Successfully deleted {content.content_type} content {content.id}")

    return w.SuccessResponse(
        success=True,
        message=f"{content.id} {content.content_type.value} content deleted successfully",
    )


# ============================================================================
# 3. FEEDBACK
# ============================================================================


async def get_feedback(
    limit: int = Query(50, le=100),
    session: AsyncSession = Depends(get_db_session_fa),
) -> w.AdminFeedbackResponse:
    """GET /api/admin/feedback - Get user feedback"""

    # Build query to get all messages with feedback, joining through conversations
    query = (
        select(Message, DBUserProfile)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .join(DBUserProfile, Conversation.user_id == DBUserProfile.id)
        .where(Message.feedback_type.is_not(None))
        .order_by(Message.feedback_given_at.desc())
        .limit(limit)
    )

    # Execute the query
    result = await session.execute(query)
    feedback_data: list[tuple[Message, DBUserProfile]] = result.all()

    # Convert to UserFeedback objects
    feedback_list = []
    for message, user in feedback_data:
        user_feedback = w.UserFeedback(
            user_id=str(user.id),
            message_id=str(message.id),
            type=message.feedback_type.value,
            comment=message.feedback_comment,
            created_at=message.feedback_given_at,
        )
        feedback_list.append(user_feedback)

    return w.AdminFeedbackResponse(feedback=feedback_list)


# ============================================================================
# 4. SOURCE DATA
# ============================================================================


async def list_source_data(
    limit: int = Query(50, le=100),
    session: AsyncSession = Depends(get_db_session_fa),
) -> w.SourceDocumentsResponse:
    """GET /api/admin/source-data/list - List uploaded files"""

    query = (
        select(DBSourceDocument)
        .order_by(DBSourceDocument.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(query)
    source_documents: list[DBSourceDocument] = result.scalars().all()

    return w.SourceDocumentsResponse(
        files=[await source_document.to_bm() for source_document in source_documents]
    )




# ============================================================================
# 4. UPLOAD  DATA
# ============================================================================

# @router.post("/upload", response_model=w.SourceDocument)
async def upload_source_pdfs(
    files: List[UploadFile] = File(...),
    session: AsyncSession = Depends(get_db_session_fa),
    spb_client: Client = Depends(get_supabase_admin_client),
):
    """
    Upload multiple PDFs to Supabase and create DB records.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    created_docs = []

    for file in files:

        # 1. Validate type
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400, detail=f"Invalid file type: {file.filename}"
            )

        # 2. Generate internal name
        file_id = uuid4()
        stored_filename = file.filename

        # 3. Read content
        content = await file.read()
        file_size = len(content)

        # 4. Upload to Supabase Storage
        try:
            spb_client.storage.from_("source-files").upload(
                stored_filename,
                content,
                {
                    "content-type": "application/pdf",
                    "upsert": "true",
                },
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Upload failed for {file.filename}: {str(e)}",
            )

        # 5. Create DB row
        db_record = DBSourceDocument(
            id=file_id,
            filename=stored_filename,
            file_size_bytes=file_size,
            active=True,
            status=DocumentStatus.COMPLETED,
        )

        session.add(db_record)
        created_docs.append(db_record)
        
        # 6. Extract and Chunk
        chunks = []
        if file.filename.lower().endswith(".pdf"):
            chunks = await extract_pdf_text(content)
            
        # 7. Generate Embeddings and Save Chunks
        if chunks:
            model = get_llm()
            tu.logger.info(f"Generated {len(chunks)} chunks for {file.filename}")
            
            for chunk in chunks:
                try:
                    # Generate embedding
                    embedding_response = await model.embedding_async(
                        chunk.content, model="text-embedding-3-small"
                    )
                    embedding_vector = embedding_response.embedding[0]
                    
                    # Create Chunk Record
                    db_chunk = DocumentChunk(
                        id=uuid4(),
                        source_document_id=file_id,
                        content=chunk.content,
                        embedding=embedding_vector,
                        location=chunk.loc,
                        model_used="text-embedding-3-small"
                    )
                    session.add(db_chunk)
                except Exception as e:
                    tu.logger.error(f"Failed to process chunk {chunk.id}: {e}")
                    # Continue to next chunk instead of failing the whole upload
                    continue


    # 6. Save everything in one commit
    await session.commit()

    # 7. Convert to wire models
    return [
        await doc.to_bm()
        for doc in created_docs
    ]
