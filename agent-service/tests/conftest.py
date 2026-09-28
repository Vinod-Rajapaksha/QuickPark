import pytest
import google.genai.types as types

class MockType:
    OBJECT = "OBJECT"
    STRING = "STRING"
    NUMBER = "NUMBER"
    INTEGER = "INTEGER"
    BOOLEAN = "BOOLEAN"
    ARRAY = "ARRAY"

types.Type = MockType
