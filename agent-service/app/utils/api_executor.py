import logging
from google import genai
from google.genai.errors import APIError
from app.utils.api_key_manager import api_key_manager

logger = logging.getLogger(__name__)

def execute_with_api_key_rotation(api_call_func):
    """
    Executes a function that takes a genai.Client.
    Rotates the API key if a 429 Too Many Requests or 503 Unavailable error occurs.
    Tries up to the total number of available keys.
    """
    from app.config.settings import settings
    if settings.AGENT_TEST_MODE:
        from app.utils.mock_llm import MockGeminiClient
        logger.info("AGENT_TEST_MODE is active. Using Mock LLM.")
        return api_call_func(MockGeminiClient())

    keys = api_key_manager.get_all_keys()
    if not keys:
        logger.warning("No API keys available.")
        return api_call_func(genai.Client())

    attempts = len(keys)
    last_exception = None

    for _ in range(attempts):
        current_key = api_key_manager.get_next_key()
        try:
            client = genai.Client(api_key=current_key)
            return api_call_func(client)
        except APIError as e:
            last_exception = e
            if e.code in (429, 503):
                logger.warning(f"API Error {e.code} with key ending in ...{current_key[-4:]}. Rotating to next key.")
                continue
            else:
                raise e
        except Exception as e:
            last_exception = e
            if "429" in str(e) or "503" in str(e) or "Too Many Requests" in str(e):
                logger.warning(f"Exception with key ending in ...{current_key[-4:]}: {e}. Rotating to next key.")
                continue
            raise e

    logger.error("All API keys exhausted or failed.")
    if last_exception:
        raise last_exception
    raise Exception("All API keys exhausted and failed.")
