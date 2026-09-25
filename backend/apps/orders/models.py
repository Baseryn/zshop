import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from zcore import Base

class Orders(Base):
    __tablename__ = "orders"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
