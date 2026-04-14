"""Helpers for marking ContentGeneration status from background tasks.

Step 2 of the video pipeline rebuild: these helpers make failures observable.
Previously, exceptions inside background tasks were logged-and-raised while the
ContentGeneration row was left with `content_path=None` forever — so the UI
just kept showing a spinner. Now every background task explicitly writes
'complete' or 'failed' to the row so the frontend can render the correct state.
"""

from tuneapi import tu
from sqlalchemy import select

from src.db import ContentGeneration, get_background_session


# Keep error messages short enough to display in the UI comfortably and avoid
# writing unbounded stack trace text into the DB.
_MAX_ERROR_LENGTH = 500


async def mark_content_failed(content_id: str, error: Exception | str) -> None:
    """Open a fresh DB session and set status='failed' + error_message.

    Uses its own session because the caller's session is typically rolled back
    by the exception that brought us here. Never raises — if we cannot write
    the failure, we log and move on (the task is already dead at that point).
    """
    error_text = str(error)
    if len(error_text) > _MAX_ERROR_LENGTH:
        error_text = error_text[: _MAX_ERROR_LENGTH - 3] + "..."

    try:
        async with get_background_session() as session:
            query = select(ContentGeneration).where(ContentGeneration.id == content_id)
            result = await session.execute(query)
            row = result.scalar_one_or_none()
            if not row:
                tu.logger.warning(
                    f"mark_content_failed: no ContentGeneration row for {content_id}"
                )
                return
            row.status = "failed"
            row.error_message = error_text
            await session.commit()
            tu.logger.info(
                f"Marked content {content_id} as failed: {error_text[:120]}"
            )
    except Exception as ex:
        # Never raise from the failure-recorder; if this fails we lose
        # observability but the request is already doomed.
        tu.logger.error(
            f"mark_content_failed: could not record failure for {content_id}: {ex}"
        )
