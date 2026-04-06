
import asyncio
from unittest.mock import MagicMock, AsyncMock
import sys
import os

# Add src to path
sys.path.append(os.getcwd())

# Mock generic objects to avoid full database dependency if possible
class MockConversation:
    def __init__(self):
        self.id = "conv_123"
        self.title = None
        self.messages = []
        self.user_id = "user_123"

class MockResponse:
    def __init__(self, content):
        self.content = content
    def __str__(self):
        return self.content

class MockModel:
    def __init__(self):
        # We need to simulate two responses:
        # 1. The chat response
        # 2. The title generation response (if called)
        # However, AsyncMock usually returns the same thing unless side_effect is used.
        # But for this simple test, returning "Calculated Title" for everything is okay 
        # as long as we distinguish by context or just check the title update.
        # Ideally, we want the title response to be "Calculated Title" and chat response to be something else.
        
        self.chat_async = AsyncMock(side_effect=[
            MockResponse("Here is a response about meditation."), # 1st call: Chat response
            MockResponse("Calculated Title"),                     # 2nd call: Title generation
            MockResponse("Calculated Title")                      # Fallback
        ])
        
    async def embedding_async(self, *args, **kwargs):
        mock_emb = MagicMock()
        mock_emb.embedding = [[0.1] * 1536]
        return mock_emb

async def test_title_generation_logic():
    print("Test: Starting Title Generation Unit Test")
    
    # 1. Setup Mocks
    mock_session = AsyncMock()
    mock_model = MockModel()
    mock_thread = MagicMock()
    mock_spb_client = MagicMock()
    
    conversation = MockConversation()
    user_message = "This is a test message about meditation."
    
    try:
        from src.services.chat import _llm_chat_streaming_optimized
        
        # Mock database result for embedding search
        mock_result = MagicMock()
        mock_result.all.return_value = [] 
        mock_session.execute.return_value = mock_result
        
    except ImportError as e:
        print(f"Failed to import chat service: {e}")
        return

    print("Test: Mocks Setup Complete")
    print(f"Initial Title: {conversation.title}")

    # 2. Run the generator
    print("Test: Running _llm_chat_streaming_optimized...")
    try:
        async for chunk in _llm_chat_streaming_optimized(
            session=mock_session,
            model=mock_model,
            master_thread=mock_thread,
            conversation=conversation,
            spb_client=mock_spb_client,
            user_message=user_message
        ):
            pass
    except Exception as e:
        # We might get errors due to downstream logic (citations, etc.) but we care about title
        # print(f"Stream execution warning (expected in mock env): {e}")
        pass
        
    # 3. Assertions
    print(f"Final Title: {conversation.title}")
    
    # Check 1: Was title updated?
    # Note: If side_effect works correctly, title should be "Calculated Title"
    # If side_effect consumption order is different, it might be the first response.
    # But logic calls chat first, then title.
    
    if conversation.title == "Calculated Title":
        print("[SUCCESS] Title was updated correct by the LLM response.")
    else:
        print(f"[FAILURE] Title is '{conversation.title}', expected 'Calculated Title'.")
        
    # Check 2: Was LLM called twice? (Chat + Title)
    call_count = len(mock_model.chat_async.await_args_list)
    if call_count >= 2:
        print(f"[SUCCESS] LLM was called {call_count} times (Expected >= 2 for Chat + Title).")
    else:
        print(f"[FAILURE] LLM was called only {call_count} times. Title generation might have been skipped.")

if __name__ == "__main__":
    try:
        asyncio.run(test_title_generation_logic())
    except Exception as e:
        print(f"Test runner error: {e}")
