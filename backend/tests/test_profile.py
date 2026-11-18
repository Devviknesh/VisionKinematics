import pytest
from fastapi.testclient import TestClient

def test_profile_read_and_update(client: TestClient, auth_headers: dict):
    # 1. Get initial profile
    me_resp = client.get("/api/auth/me", headers=auth_headers)
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert "email" in user_data
    assert "preferences" in user_data

    # 2. Update profile name and analysis preferences
    new_prefs = {
        "default_sample_fps": 10.0,
        "head_pose_sensitivity": "high",
        "auto_hud_overlay": False,
        "gaze_calibration_mode": "relaxed"
    }
    update_resp = client.put(
        "/api/auth/profile",
        headers=auth_headers,
        json={"name": "Updated Lead Researcher", "preferences": new_prefs}
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["name"] == "Updated Lead Researcher"
    assert updated_data["preferences"]["default_sample_fps"] == 10.0
    assert updated_data["preferences"]["head_pose_sensitivity"] == "high"

def test_password_change_flow(client: TestClient):
    # 1. Register a dedicated user for password change test
    email = "pwdchange@test.com"
    old_pw = "InitialPassword123!"
    new_pw = "BrandNewPassword2026!"

    client.post("/api/auth/register", json={
        "name": "Password User",
        "email": email,
        "password": old_pw
    })

    login_resp = client.post("/api/auth/login", json={"email": email, "password": old_pw})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Change password with incorrect current password -> 400
    fail_resp = client.put("/api/auth/password", headers=headers, json={
        "current_password": "WrongPassword!",
        "new_password": new_pw
    })
    assert fail_resp.status_code == 400

    # 3. Change password with correct current password -> 200
    success_resp = client.put("/api/auth/password", headers=headers, json={
        "current_password": old_pw,
        "new_password": new_pw
    })
    assert success_resp.status_code == 200

    # 4. Old password should now fail
    old_login = client.post("/api/auth/login", json={"email": email, "password": old_pw})
    assert old_login.status_code == 401

    # 5. New password should succeed
    new_login = client.post("/api/auth/login", json={"email": email, "password": new_pw})
    assert new_login.status_code == 200
