import httpx
from app.config.settings import settings


class ApiClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or settings.BACKEND_API_URL
        self.client = httpx.Client(base_url=self.base_url, timeout=15.0)

    def get(self, path: str, params: dict | None = None) -> dict:
        response = self.client.get(path, params=params)
        response.raise_for_status()
        return response.json()

    def post(self, path: str, json: dict | None = None) -> dict:
        response = self.client.post(path, json=json)
        response.raise_for_status()
        return response.json()

    def close(self):
        self.client.close()
