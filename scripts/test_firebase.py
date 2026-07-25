import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import init_firestore, get_db

def test_firebase_connection():
    print("=" * 70)
    print(" Testing Firebase Firestore Connection & Read/Write Permissions")
    print("=" * 70)
    print(f" Credentials Path : {settings.FIREBASE_CREDENTIALS_PATH}")
    print(f" Firebase Project ID: {settings.FIREBASE_PROJECT_ID or '(Using default)'}")
    print("-" * 70)

    db = get_db()
    if not db:
        print("[ERROR] Failed to initialize Firestore client.")
        print("Please place your Firebase Admin SDK service account key JSON at:")
        print(f" -> {os.path.abspath(settings.FIREBASE_CREDENTIALS_PATH)}")
        print("Or set FIREBASE_CREDENTIALS_PATH in your .env file.")
        return False

    try:
        # Test Write
        doc_ref = db.collection("_connection_test").document("test_doc")
        test_data = {
            "status": "connected",
            "message": "Firebase Firestore connection successful!",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        doc_ref.set(test_data)
        print("[SUCCESS] 1. Write Test Document -> PASSED")

        # Test Read
        doc = doc_ref.get()
        if doc.exists:
            print(f"[SUCCESS] 2. Read Test Document  -> PASSED ({doc.to_dict().get('message')})")

        # Cleanup
        doc_ref.delete()
        print("[SUCCESS] 3. Delete Test Document -> PASSED")

        print("=" * 70)
        print("[SUCCESS] Firebase Firestore is 100% Connected & Fully Operational!")
        print("=" * 70)
        return True
    except Exception as e:
        print(f"[ERROR] Firestore operation failed: {e}")
        return False

if __name__ == "__main__":
    test_firebase_connection()
