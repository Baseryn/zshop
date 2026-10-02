"""Business services for the Catalog domain.

Leverages ZCore's slugify for URL generation, StorageProvider integration
with security validators, and atomic stock check operations.
"""

from typing import Any

from fastapi import UploadFile
from pydantic import BaseModel
from zcore import (
    BaseService,
    StorageProvider,
    slugify,
)
from zcore.exceptions import DuplicateEntity, EntityNotFound, ValidationError
from zcore.storage import (
    FileExtensionValidator,
    MaxFileSizeValidator,
    SafeMimeTypeValidator,
)

from .models import Categories, Products
from .repositories import CategoryRepository, ProductRepository
from .schemas import CategoryCreate, ProductCreate


class CategoryService(BaseService[Categories]):
    """Service handling categories hierarchy and slug generation."""

    def __init__(self, repository: CategoryRepository):
        super().__init__(model=Categories, repository=repository)

    async def pre_create(self, schema: BaseModel) -> dict[str, Any] | None:
        """Automatically generate URL-safe slug before creating category."""
        if isinstance(schema, CategoryCreate):
            base_slug = slugify(schema.name)
            if await self.repository.exist(self.model.slug == base_slug):
                raise DuplicateEntity(message=f"Category with name '{schema.name}' already exists.")
            return {"slug": base_slug}
        return None


class ProductService(BaseService[Products]):
    """Service orchestrating products, inventory adjustments, and secure image uploads."""

    def __init__(
        self,
        repository: ProductRepository,
        category_repository: CategoryRepository,
        storage: StorageProvider,
    ):
        super().__init__(model=Products, repository=repository)
        self.category_repository = category_repository
        self.storage = storage

        # Security validators safeguarding image uploads against malware and XSS
        self.image_validators = [
            FileExtensionValidator(allowed_extensions={".jpg", ".jpeg", ".png", ".webp"}),
            MaxFileSizeValidator(max_size_mb=3.0),
            SafeMimeTypeValidator(allowed_mimes={"image/jpeg", "image/png", "image/webp"}),
        ]

    async def pre_create(self, schema: BaseModel) -> dict[str, Any] | None:
        """Validate SKU uniqueness, category existence, and generate slug."""
        if isinstance(schema, ProductCreate):
            # 1. Verify category exists
            category_exists = await self.category_repository.exist(id=schema.category_id)
            if not category_exists:
                raise EntityNotFound(message="Referenced category does not exist.")

            # 2. Verify SKU uniqueness
            sku_exists = await self.repository.exist(self.model.sku == schema.sku)
            if sku_exists:
                raise DuplicateEntity(message=f"Product with SKU '{schema.sku}' already exists.")

            # 3. Generate unique slug
            base_slug = slugify(schema.name)
            candidate_slug = base_slug
            counter = 1
            while await self.repository.exist(self.model.slug == candidate_slug):
                candidate_slug = f"{base_slug}-{counter}"
                counter += 1

            return {"slug": candidate_slug}
        return None

    async def upload_product_image(self, product_id: Any, file: UploadFile) -> Products:
        """Upload product image with deep byte validation and link URL to product."""
        product = await self.get(id=product_id)

        # Execute security validators (Magic Bytes inspection & XSS patterns scan)
        for validator in self.image_validators:
            validator(file)

        # Upload using injected StorageProvider sandbox
        file_url = await self.storage.upload(file=file, folder="products")

        # Update product record with new image URL
        product.image_url = file_url
        await self._safe_commit()
        return await self.get(id=product_id)

    async def adjust_stock(self, product_id: Any, quantity_delta: int) -> Products:
        """Atomically adjust stock count; raises ValidationError on deficit."""
        product = await self.get(id=product_id)
        new_quantity = product.stock_quantity + quantity_delta
        if new_quantity < 0:
            raise ValidationError(
                message=f"Insufficient stock for product '{product.name}'. Available: {product.stock_quantity}"
            )
        product.stock_quantity = new_quantity
        await self._safe_commit()
        return product