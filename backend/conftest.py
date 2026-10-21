"""Pytest root configuration leveraging ZCore Native Testing Engine.

Provides zero-boilerplate test environment initialization. All tests
directly manage their own isolation and contexts via ZTestClient.
"""

import sys
from pathlib import Path

# Add backend directory to Python path first
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest
from zcore.testing import setup_test_database

import apps.catalog.models
import apps.identity.models
import apps.orders.models  # noqa: F401


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database() -> None:
    """Provision the isolated test database schema once for the test session."""
    setup_test_database()
