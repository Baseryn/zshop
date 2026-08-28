# import pytest
# import uuid
# from zcore.testing import ZTestClient
# from main import app

# @pytest.mark.asyncio
# async def test_get_identity_list():
#     uid = uuid.uuid4()
#     async with ZTestClient(app, user_id=uid, scopes=["identity:listview"]) as client:
#         response = await client.get("/identity/")
#         assert response.status_code == 200
