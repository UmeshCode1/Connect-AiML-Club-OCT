def test_unauthenticated_request_is_rejected(client):
    response = client.get("/v1/auth/me")
    assert response.status_code == 401
    error = response.json().get("error", {})
    assert error["code"] == "UNAUTHORIZED"
    assert "Authorization bearer token" in error["message"]


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
