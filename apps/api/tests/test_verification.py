def test_valid_certificate_verification(client):
    response = client.get("/v1/public/certificates/verify/AIML26-APT-000184")
    assert response.status_code == 200
    res_data = response.json()
    assert "data" in res_data
    cert = res_data["data"]
    assert cert["valid"] is True
    assert cert["certificate_id"] == "AIML26-APT-000184"
    assert cert["status"] == "VALID"
    # Strict privacy requirement: sensitive student data must not be returned
    assert "phone" not in cert
    assert "email" not in cert
    assert "attendance" not in cert


def test_invalid_certificate_returns_not_found(client):
    response = client.get("/v1/public/certificates/verify/INVALID-ID-999")
    assert response.status_code == 404
    error = response.json().get("error", {})
    assert error["code"] == "NOT_FOUND"
    assert "not found" in error["message"].lower()
