import sys
import os
import json
from datetime import date, datetime

# Ensure app in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

def generate_openapi_and_postman():
    docs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs"))
    os.makedirs(docs_dir, exist_ok=True)

    # 1. Generate OpenAPI JSON
    openapi_schema = app.openapi()
    openapi_path = os.path.join(docs_dir, "openapi.json")
    with open(openapi_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"[INFO] OpenAPI JSON generated at: {openapi_path}")

    # 2. Generate Postman Collection v2.1
    postman_items = []
    for path, methods in openapi_schema.get("paths", {}).items():
        for method, details in methods.items():
            item_name = details.get("summary") or f"{method.upper()} {path}"
            tag = details.get("tags", ["General"])[0]

            postman_item = {
                "name": f"[{tag}] {item_name}",
                "request": {
                    "method": method.upper(),
                    "header": [
                        {"key": "Accept", "value": "application/json"},
                        {"key": "Content-Type", "value": "application/json"}
                    ],
                    "url": {
                        "raw": "{{baseUrl}}" + path,
                        "host": ["{{baseUrl}}"],
                        "path": [p for p in path.split("/") if p]
                    },
                    "description": details.get("description", "")
                }
            }
            postman_items.append(postman_item)

    postman_collection = {
        "info": {
            "name": "Food Subscription & Ledger Management API Collection",
            "description": "Production Postman collection for Healthy Home's Foods Backend API",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "variable": [
            {
                "key": "baseUrl",
                "value": "http://localhost:8000/api/v1",
                "type": "string"
            }
        ],
        "item": postman_items
    }

    postman_path = os.path.join(docs_dir, "postman_collection.json")
    with open(postman_path, "w", encoding="utf-8") as f:
        json.dump(postman_collection, f, indent=2)
    print(f"[INFO] Postman Collection generated at: {postman_path}")

if __name__ == "__main__":
    generate_openapi_and_postman()
