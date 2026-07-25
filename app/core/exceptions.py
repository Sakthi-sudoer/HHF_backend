from typing import Any, List, Optional

class DomainException(Exception):
    def __init__(self, message: str, errors: Optional[List[str]] = None, code: int = 400):
        super().__init__(message)
        self.message = message
        self.errors = errors or []
        self.code = code

class EntityNotFoundException(DomainException):
    def __init__(self, entity_name: str, entity_id: str):
        message = f"{entity_name} with ID '{entity_id}' was not found."
        super().__init__(message=message, code=404)

class ValidationException(DomainException):
    def __init__(self, message: str, errors: Optional[List[str]] = None):
        super().__init__(message=message, errors=errors, code=422)

class BusinessRuleViolationException(DomainException):
    def __init__(self, message: str, errors: Optional[List[str]] = None):
        super().__init__(message=message, errors=errors, code=400)

class DatabaseException(DomainException):
    def __init__(self, message: str, errors: Optional[List[str]] = None):
        super().__init__(message=message, errors=errors, code=500)
