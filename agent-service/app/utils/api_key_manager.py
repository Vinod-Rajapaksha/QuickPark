import threading
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

class ApiKeyManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ApiKeyManager, cls).__new__(cls)
                cls._instance._initialize()
            return cls._instance

    def _initialize(self):
        keys_str = getattr(settings, "GOOGLE_API_KEY", "")
        self.api_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        self.current_index = 0
        self._index_lock = threading.Lock()
        
        if not self.api_keys:
            logger.warning("No GOOGLE_API_KEY provided in settings. Features might fail.")

    def get_next_key(self) -> str:
        if not self.api_keys:
            return None
            
        with self._index_lock:
            key = self.api_keys[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.api_keys)
            return key

    def get_all_keys(self) -> list[str]:
        return self.api_keys

api_key_manager = ApiKeyManager()
