import json

from fastapi.testclient import TestClient

from main import app
from core.database import get_db


class DummySession:
    def __init__(self):
        self.added = []
        self.committed = False

    def scalars(self, *args, **kwargs):
        class Result:
            def all(self):
                return []

        return Result()

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True


client = TestClient(app)


def override_get_db():
    return DummySession()


app.dependency_overrides[get_db] = override_get_db


def test_employee_import_accepts_json_file_upload():
    payload = [
        {
            "highspringEmail": "emp1@company.com",
            "email": "emp1@gmail.com",
            "firstName": "Jane",
            "lastName": "Doe",
            "ldap": "jd1",
            "role": "USER",
        }
    ]

    response = client.post(
        "/employees/import",
        files={"file": ("employees.json", json.dumps(payload), "application/json")},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["created"] == 1
