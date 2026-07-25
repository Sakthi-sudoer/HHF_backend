from typing import Generic, TypeVar, List, Optional, Dict, Any
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.database import get_db
from app.core.logging import logger

T = TypeVar("T")

# Shared global storage dictionary keyed by collection_name for local fallback
_GLOBAL_IN_MEMORY_STORES: Dict[str, Dict[str, Any]] = {}

class BaseRepository(Generic[T]):
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        if collection_name not in _GLOBAL_IN_MEMORY_STORES:
            _GLOBAL_IN_MEMORY_STORES[collection_name] = {}

    @property
    def _in_memory_store(self) -> Dict[str, Any]:
        return _GLOBAL_IN_MEMORY_STORES[self.collection_name]

    @property
    def db(self):
        return get_db()

    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        db = self.db
        if db:
            doc = db.collection(self.collection_name).document(item_id).get()
            if doc.exists:
                data = doc.to_dict()
                data["id"] = doc.id
                return data
            return None
        else:
            return self._in_memory_store.get(item_id)

    def list_all(self, filters: Optional[List[tuple]] = None) -> List[Dict[str, Any]]:
        db = self.db
        if db:
            query = db.collection(self.collection_name)
            if filters:
                for field, op, val in filters:
                    query = query.where(filter=FieldFilter(field, op, val))
            docs = query.stream()
            results = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                results.append(data)
            return results
        else:
            res = list(self._in_memory_store.values())
            if filters:
                for field, op, val in filters:
                    if op == "==":
                        res = [r for r in res if r.get(field) == val]
            return res

    def create(self, item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        data["id"] = item_id
        db = self.db
        if db:
            db.collection(self.collection_name).document(item_id).set(data)
            logger.info(f"Firestore Operation: Created {self.collection_name}/{item_id}")
        else:
            self._in_memory_store[item_id] = data
        return data

    def update(self, item_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        db = self.db
        if db:
            doc_ref = db.collection(self.collection_name).document(item_id)
            doc_ref.update(data)
            logger.info(f"Firestore Operation: Updated {self.collection_name}/{item_id}")
            return self.get_by_id(item_id)
        else:
            if item_id in self._in_memory_store:
                self._in_memory_store[item_id].update(data)
                return self._in_memory_store[item_id]
            return None

    def delete(self, item_id: str) -> bool:
        db = self.db
        if db:
            db.collection(self.collection_name).document(item_id).delete()
            logger.info(f"Firestore Operation: Deleted {self.collection_name}/{item_id}")
            return True
        else:
            if item_id in self._in_memory_store:
                del self._in_memory_store[item_id]
                return True
            return False
