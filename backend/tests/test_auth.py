def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Alice Smith", "email": "alice@example.com", "password": "SuperSecretPassword123!"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice Smith"
    assert data["email"] == "alice@example.com"
    assert "id" in data

def test_register_duplicate_email(client, test_user):
    response = client.post(
        "/api/auth/register",
        json={"name": "Duplicate", "email": test_user.email, "password": "Password123!"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "SecurePassword123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_user.email

def test_login_invalid_password(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "WrongPassword"}
    )
    assert response.status_code == 401

def test_protected_me_endpoint(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "engineer@test.com"

def test_protected_me_endpoint_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
