import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import init_firestore, get_db

def clean_database_keep_expenses():
    print("=" * 70)
    print(" Firestore Database Analysis & Formatting Utility")
    print(f" Target Project ID: {settings.FIREBASE_PROJECT_ID}")
    print("=" * 70)

    db = get_db()
    if not db:
        print("[ERROR] Could not connect to Firestore database.")
        return

    # Collections to purge (remove test/sample data)
    collections_to_purge = [
        "subscriptions",
        "invoices",
        "payments",
        "dailyDeliveries",
        "_connection_test"
    ]

    # Collections to KEEP
    collections_to_keep = [
        "expenses"
    ]

    print("\n[1/3] Analyzing Current Firestore Collections...")
    for col_name in collections_to_purge + collections_to_keep + ["customers", "settings"]:
        docs = list(db.collection(col_name).stream())
        action_label = "KEEP" if col_name in collections_to_keep else "PURGE"
        print(f"  - Collection '{col_name}': {len(docs)} document(s) -> [{action_label}]")

    print("\n[2/3] Cleaning subscriptions, invoices, payments, dailyDeliveries...")
    total_deleted = 0
    for col_name in collections_to_purge:
        docs = db.collection(col_name).stream()
        count = 0
        for doc in docs:
            doc.reference.delete()
            count += 1
            total_deleted += 1
        if count > 0:
            print(f"  [CLEANED] Deleted {count} document(s) from '{col_name}'.")

    print("\n[3/3] Preserving 'expenses' collection...")
    expense_docs = list(db.collection("expenses").stream())
    print(f"  [PRESERVED] Collection 'expenses' contains {len(expense_docs)} document(s) untouched.")

    print("\n" + "=" * 70)
    print(f" [SUCCESS] Database formatized! Purged {total_deleted} test records.")
    print(" 'expenses' collection remains 100% preserved.")
    print("=" * 70)

if __name__ == "__main__":
    clean_database_keep_expenses()
