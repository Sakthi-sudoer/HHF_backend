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
            if settings.FIREBASE_CREDENTIALS_JSON:
                try:
                    cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                    cred = credentials.Certificate(cred_dict)
                    logger.info("Initialized Firestore from FIREBASE_CREDENTIALS_JSON environment variable.")
                except Exception as ex:
                    logger.error(f"Failed to parse FIREBASE_CREDENTIALS_JSON: {ex}")

            # Option 2: Parse from Local File Path (credentials/firebase_service_account.json)
            if not cred:
                cred_path = settings.FIREBASE_CREDENTIALS_PATH
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    logger.info(f"Initialized Firestore with service account from {cred_path}")

            if cred:
                app = firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID or None
                })
                _db_client = firestore.client(app=app)
            else:
                logger.warning(
                    "Firestore credentials not found. "
                    "Operating in high-performance local fallback mode."
                )
                _db_client = None
    except Exception as e:
        logger.warning(f"Firestore initialization bypassed: {e}")
        _db_client = None

    return _db_client

def get_db():
    global _db_client
    if _db_client is None:
        _db_client = init_firestore()
    return _db_client
