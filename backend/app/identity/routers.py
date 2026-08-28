from typing import Any
from zcore import BaseRouter, RouteKey

from .schemas import IdentityCreate, IdentityUpdate, IdentityResponse
from .services import IdentityService
from .models import Identity

class IdentityRouter(BaseRouter[IdentityCreate, IdentityUpdate]):
    model = Identity
    create_schema = IdentityCreate
    update_schema = IdentityUpdate
    schema_out = IdentityResponse
    service = IdentityService
    
    prefix = "/identity"
    tags = ["Identity"]
    # expose_schemas = True  # Set True to auto-expose JSON Schema on endpoints

    def get_route_dependencies(self, route_key: RouteKey, action: str) -> list[Any]:
        """Retrieve the dependencies list for the router endpoints.
        
        By overriding this method, you can dynamically inject custom authentication,
        authorization, logging, or rate-limiting dependencies for specific route keys.
        """
        # Example: Add custom dependencies to delete operation, fallback to standard permissions for others
        if route_key == RouteKey.DELETE:
            # return [MyCustomAdminPermission()]
            pass
            
        return super().get_route_dependencies(route_key, action)

# Export the FastAPI router
router_instance = IdentityRouter()
