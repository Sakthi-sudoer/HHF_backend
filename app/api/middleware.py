import time
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.exceptions import DomainException
from app.core.logging import logger

class ErrorAndLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        path = request.url.path
        method = request.method

        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            logger.info(f"API Request: {method} {path} - Status: {response.status_code} - {process_time:.2f}ms")
            return response
        except DomainException as exc:
            process_time = (time.time() - start_time) * 1000
            logger.warning(f"Domain Exception on {method} {path}: {exc.message}")
            return JSONResponse(
                status_code=exc.code,
                content={
                    "success": False,
                    "data": None,
                    "message": exc.message,
                    "errors": exc.errors or [exc.message]
                }
            )
        except Exception as exc:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"Unhandled Exception on {method} {path}: {str(exc)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "data": None,
                    "message": "An unexpected internal server error occurred.",
                    "errors": [str(exc)]
                }
            )
