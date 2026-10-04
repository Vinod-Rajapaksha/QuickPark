import json
from app.config.settings import settings

class MockFunctionCall:
    def __init__(self, name, args):
        self.name = name
        self.args = args

class MockPart:
    def __init__(self, text=None, function_call=None):
        self.text = text
        self.function_call = function_call

class MockContent:
    def __init__(self, parts=None):
        self.parts = parts or []

class MockCandidate:
    def __init__(self, content):
        self.content = content

class MockResponse:
    def __init__(self, text="", candidates=None):
        self.text = text
        self.candidates = candidates or []
        try:
            self.parsed = json.loads(text)
        except Exception:
            self.parsed = None

class MockModels:
    def generate_content(self, model, contents, config=None, **kwargs):
        is_json = config and getattr(config, 'response_mime_type', None) == "application/json"
        content_str = str(contents).lower()
        
        if is_json:
            if "demand" in content_str or "analyze" in content_str or "analyst" in content_str:
                return MockResponse('{"summary": "Mock summary", "insights": ["Mock insight"], "recommendations": ["Mock recommendation"]}')
            else:
                # Recommendation agent
                return MockResponse('{"recommendations": [{"parking_id": "parking-123", "parking_name": "Mock Parking", "rank": 1, "reason": "Mocked for performance testing", "matched_preferences": [], "confidence": 0.9}]}')
        
        # Planning Agent
        if "reserve" in content_str or "book" in content_str:
            func_call = MockFunctionCall(
                name="request_reservation_approval", 
                args={"parking_id": "parking-123", "start_time": "2026-10-04T10:00:00", "end_time": "2026-10-04T12:00:00"}
            )
            content = MockContent(parts=[MockPart(function_call=func_call)])
            return MockResponse(text="", candidates=[MockCandidate(content=content)])
            
        return MockResponse(
            text="This is a mock response from the AI for performance testing.", 
            candidates=[MockCandidate(content=MockContent(parts=[MockPart(text="This is a mock response from the AI for performance testing.")]))]
        )

class MockGeminiClient:
    def __init__(self, *args, **kwargs):
        self.models = MockModels()
