"""Person 4. GET /patients/{id}/kanta-medicines: the fixture medicine list as a labelled FHIR mock-up."""


async def test_kanta_medicines_are_a_labelled_fhir_mockup(client):
    r = await client.get("/patients/some-patient/kanta-medicines")
    assert r.status_code == 200
    body = r.json()
    assert body["label"] == "(FHIR mock-up)"
    assert body["mock"] is True
    bundle = body["bundle"]
    assert bundle["resourceType"] == "Bundle" and bundle["type"] == "collection"
    texts = [e["resource"]["medicationCodeableConcept"]["text"] for e in bundle["entry"]]
    assert "Cancer medicine, tablets, morning" in texts
    assert all(e["resource"]["resourceType"] == "MedicationStatement" for e in bundle["entry"])
    assert [m["id"] for m in body["medicines"]] == ["med_morning", "med_evening", "med_nausea"]
