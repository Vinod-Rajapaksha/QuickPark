from typing import Any, Dict, Optional

import httpx

from app.config.settings import settings

DEFAULT_TIMEOUT_SECONDS = 15.0


class ApiError(Exception):
    """Backend failure. Messages carry the path and status only, never the token."""


class ApiClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        self.base_url = (base_url if base_url is not None else settings.BACKEND_API_URL).rstrip("/")
        self._transport = transport

    def get(self, path: str, *, token: Optional[str] = None, params: Optional[Dict[str, str]] = None) -> Any:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        try:
            with httpx.Client(transport=self._transport, timeout=DEFAULT_TIMEOUT_SECONDS) as client:
                response = client.get(
                    f"{self.base_url}{path}",
                    params=params,
                    headers=headers,
                )
        except httpx.HTTPError as exc:
            raise ApiError(f"{path}: request to the QuickPark backend failed") from exc

        if response.status_code >= 400:
            raise ApiError(f"{path}: backend returned {response.status_code}. Details: {response.text}")

        return response.json()

    def post(self, path: str, *, token: Optional[str] = None, payload: Optional[Dict[str, Any]] = None) -> Any:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        try:
            with httpx.Client(transport=self._transport, timeout=DEFAULT_TIMEOUT_SECONDS) as client:
                response = client.post(
                    f"{self.base_url}{path}",
                    json=payload,
                    headers=headers,
                )
        except httpx.HTTPError as exc:
            raise ApiError(f"{path}: POST request to the QuickPark backend failed") from exc

        if response.status_code >= 400:
            raise ApiError(f"{path}: backend returned {response.status_code}")

        return response.json()
