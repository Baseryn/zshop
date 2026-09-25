import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from zcore import Base

class Catalog(Base):
    __tablename__ = "catalog"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
