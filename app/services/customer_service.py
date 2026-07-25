import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.models.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatus
from app.repositories.customer_repository import CustomerRepository
from app.core.exceptions import EntityNotFoundException
from app.core.logging import logger

class CustomerService:
    def __init__(self):
        self.repo = CustomerRepository()

    def create_customer(self, payload: CustomerCreate) -> CustomerResponse:
        cust_id = f"cust_{uuid.uuid4().hex[:10]}"
        now_str = datetime.now(timezone.utc).isoformat()
        
        cust_dict = {
            "id": cust_id,
            "name": payload.name,
            "phone": payload.phone,
            "address": payload.address,
            "landmark": payload.landmark,
            "status": CustomerStatus.ACTIVE.value,
            "is_deleted": False,
            "created_at": now_str,
            "updated_at": now_str
        }

        self.repo.create(cust_id, cust_dict)
        logger.info(f"Created customer {cust_id}: {payload.name}")
        return self._to_response(cust_dict)

    def get_customer(self, customer_id: str) -> CustomerResponse:
        cust = self.repo.get_by_id(customer_id)
        if not cust or cust.get("is_deleted"):
            raise EntityNotFoundException("Customer", customer_id)
        return self._to_response(cust)

    def search_customers(self, query: str = "") -> List[CustomerResponse]:
        custs = self.repo.search_customers(query)
        return [self._to_response(c) for c in custs]

    def update_customer(self, customer_id: str, payload: CustomerUpdate) -> CustomerResponse:
        cust = self.repo.get_by_id(customer_id)
        if not cust or cust.get("is_deleted"):
            raise EntityNotFoundException("Customer", customer_id)

        update_dict = payload.model_dump(exclude_unset=True)
        if "status" in update_dict and isinstance(update_dict["status"], CustomerStatus):
            update_dict["status"] = update_dict["status"].value

        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        updated = self.repo.update(customer_id, update_dict)
        return self._to_response(updated)

    def archive_customer(self, customer_id: str) -> CustomerResponse:
        """Soft delete / Archive customer"""
        cust = self.repo.get_by_id(customer_id)
        if not cust or cust.get("is_deleted"):
            raise EntityNotFoundException("Customer", customer_id)

        update_dict = {
            "status": CustomerStatus.ARCHIVED.value,
            "is_deleted": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        updated = self.repo.update(customer_id, update_dict)
        logger.info(f"Archived customer {customer_id}")
        return self._to_response(updated)

    def _to_response(self, d: Dict[str, Any]) -> CustomerResponse:
        return CustomerResponse(
            id=d["id"],
            name=d["name"],
            phone=d["phone"],
            address=d["address"],
            landmark=d.get("landmark"),
            status=CustomerStatus(d["status"]),
            is_deleted=d.get("is_deleted", False),
            created_at=datetime.fromisoformat(d["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(d["updated_at"].replace("Z", "+00:00"))
        )
