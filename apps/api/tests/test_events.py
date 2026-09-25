def test_list_events(client):
    response = client.get("/v1/events")
    assert response.status_code == 200
    res_data = response.json()
    assert "data" in res_data
    assert "meta" in res_data
    events = res_data["data"]
    assert isinstance(events, list)
    assert len(events) >= 1
    assert events[0]["event_code"] == "EVT-APTIFY-2026"
    assert events[0]["visibility"] == "PUBLIC"
