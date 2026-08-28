from zcore import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
import uuid

class Identity(Base):
    __tablename__ = "identity"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # TODO: Define your schema / columns below:
    # name: Mapped[str] = mapped_column(String(255), index=True)
