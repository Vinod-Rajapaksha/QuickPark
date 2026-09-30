import logging
from functools import wraps
from typing import Callable, Any

logger = logging.getLogger(__name__)

def handle_agent_errors(default_error_return: Any = None) -> Callable:
    """
    A reusable decorator to centralize logging and error handling for agent methods.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Error in {func.__name__}: {e}")
                if default_error_return is not None:
                    return default_error_return
                return {"error": str(e), "status": "failed"}
        return wrapper
    return decorator
