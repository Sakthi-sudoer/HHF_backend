import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings
from app.core.logging import logger

_db_client = None

def init_firestore():
    global _db_client
    if _db_client is not None:
        return _db_client

    try:
        if firebase_admin._apps:
            app = firebase_admin.get_app()
            _db_client = firestore.client(app=app)
        else:
            cred = None
            # Option 1: Parse from FIREBASE_CREDENTIALS_JSON Environment Variable (Cloud Deployment)
            raw_json = settings.FIREBASE_CREDENTIALS_JSON or os.environ.get("FIREBASE_CREDENTIALS_JSON")
            if raw_json:
                try:
                    if isinstance(raw_json, dict):
                        cred_dict = raw_json
                    else:
                        clean_str = str(raw_json).strip().strip("'")
                        try:
                            cred_dict = json.loads(clean_str, strict=False)
                        except Exception:
                            clean_str_escaped = clean_str.replace("\r\n", "\\n").replace("\n", "\\n")
                            cred_dict = json.loads(clean_str_escaped, strict=False)

                    cred = credentials.Certificate(cred_dict)
                    logger.info("Successfully initialized Firestore from FIREBASE_CREDENTIALS_JSON environment variable.")
                except Exception as ex:
                    logger.error(f"Failed to parse FIREBASE_CREDENTIALS_JSON: {ex}")

            # Option 2: Search multiple potential credential file locations
            if not cred:
                candidate_paths = [
                    settings.FIREBASE_CREDENTIALS_PATH,
                    os.path.join(os.getcwd(), "credentials", "firebase_service_account.json"),
                    os.path.join(os.path.dirname(__file__), "..", "..", "credentials", "firebase_service_account.json"),
                    r"C:\Users\SAKTHIVEL\Documents\cred\firebase_service_account.json"
                ]

                for path in candidate_paths:
                    if path and os.path.exists(path):
                        try:
                            cred = credentials.Certificate(path)
                            logger.info(f"Successfully initialized Firestore with service account from: {path}")
                            break
                        except Exception as cerrex:
                            logger.error(f"Error loading credentials from {path}: {cerrex}")

            if cred:
                app = firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID or None
                })
                _db_client = firestore.client(app=app)
            else:
                logger.warning(
                    "Firestore credentials not found in any candidate path. "
                    "Operating in high-performance local fallback mode."
                )
                _db_client = None
    except Exception as e:
        logger.warning(f"Firestore initialization error: {e}")
        _db_client = None

    return _db_client

def get_db():
    global _db_client
    if _db_client is None:
        _db_client = init_firestore()
    return _db_client
