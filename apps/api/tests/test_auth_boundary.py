def test_unauthenticated_request_is_rejected(client):
    response = client.get("/v1/auth/me")
    assert response.status_code == 401
    error = response.json().get("error", {})
    assert error["code"] == "UNAUTHORIZED"
    assert "Authorization bearer token" in error["message"]
    assert "request_id" in error


def test_authenticated_admin_request(client):
    headers = {"Authorization": "Bearer dev-admin-token"}
    response = client.get("/v1/auth/me", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert "data" in res_data
    user = res_data["data"]
    assert user["role"] == "CLUB_ADMIN"
    assert "events.view" in user["permissions"]
    assert user["email"] == "admin@aimlcluboct.in"


def test_permission_denied_returns_403(client):
    headers = {"Authorization": "Bearer dev-viewer-token"}
    response = client.get("/v1/auth/check-permission?action=events.delete", headers=headers)
    assert response.status_code == 403
    error = response.json().get("error", {})
    assert error["code"] == "PERMISSION_DENIED"
    assert "Permission denied for action: 'events.delete'" in error["message"]
    assert "request_id" in error


def test_wildcard_permission_resolution(client):
    # CLUB_ADMIN has 'chronicle.*'
    headers = {"Authorization": "Bearer dev-admin-token"}
    response = client.get("/v1/auth/check-permission?action=chronicle.publish", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["data"]["granted"] is True


def test_super_admin_universal_permission(client):
    # SUPER_ADMIN has '*'
    headers = {"Authorization": "Bearer dev-super-token"}
    response = client.get("/v1/auth/check-permission?action=anything.unrestricted", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["data"]["granted"] is True
