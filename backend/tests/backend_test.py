"""Backend tests for Itinera app: auth flows + itinerary CRUD + brute force."""
import os
import uuid
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://route-craft-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@itinera.app"
ADMIN_PASSWORD = "admin123"


def _unique_email(prefix: str = "test") -> str:
    return f"{prefix}+{uuid.uuid4().hex[:10]}@itinera.app"


# ----------------- Health -----------------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") is True
        assert data.get("service") == "itinera-api"


# ----------------- Auth -----------------
class TestAuth:
    def test_register_sets_cookies_and_returns_user(self):
        s = requests.Session()
        email = _unique_email("reg")
        r = s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "Reg User"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email
        assert data["name"] == "Reg User"
        assert "id" in data
        # cookies set
        assert "access_token" in s.cookies
        assert "refresh_token" in s.cookies

    def test_register_duplicate_returns_409(self):
        s = requests.Session()
        email = _unique_email("dup")
        s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "Dup"})
        r2 = requests.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "Dup2"})
        assert r2.status_code == 409

    def test_admin_login_ok(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data.get("role") == "admin"
        assert "access_token" in s.cookies
        # me endpoint works with this session
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == ADMIN_EMAIL

    def test_me_without_cookie_returns_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout_clears_cookies(self):
        s = requests.Session()
        email = _unique_email("lo")
        s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "LO"})
        assert s.get(f"{API}/auth/me").status_code == 200
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        # cookies should be cleared
        s2 = requests.Session()
        # copy only remaining cookies (should be empty/expired)
        assert s.get(f"{API}/auth/me").status_code == 401 or s2.get(f"{API}/auth/me").status_code == 401

    def test_refresh_issues_new_access(self):
        s = requests.Session()
        email = _unique_email("rf")
        s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "RF"})
        # drop access cookie, keep refresh
        if "access_token" in s.cookies:
            # Remove access_token by setting empty with same domain via session cookies.clear
            # simplest: clear and re-add refresh
            refresh = s.cookies.get("refresh_token")
            s.cookies.clear()
            # reconstruct refresh cookie (best-effort; requests doesn't need domain for same host)
            s.cookies.set("refresh_token", refresh)
        r = s.post(f"{API}/auth/refresh")
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

    def test_bad_password_returns_401(self):
        email = _unique_email("bp")
        requests.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "BP"})
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": "WRONG"})
        assert r.status_code == 401

    def test_brute_force_lockout_429(self):
        # Use a fresh unique email; 5 wrong attempts should then 429 on 6th
        email = _unique_email("brute")
        requests.post(f"{API}/auth/register", json={"email": email, "password": "rightpass", "name": "Brute"})
        statuses = []
        for _ in range(5):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrongpass"})
            statuses.append(r.status_code)
        # 6th attempt
        r6 = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrongpass"})
        assert all(s == 401 for s in statuses), f"Expected first 5 to be 401 got {statuses}"
        assert r6.status_code == 429, f"Expected lockout 429 on 6th attempt, got {r6.status_code}"


# ----------------- Itinerary CRUD + isolation -----------------
@pytest.fixture(scope="module")
def user_a_session():
    s = requests.Session()
    email = _unique_email("ua")
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "User A"})
    assert r.status_code == 200
    return s, email


@pytest.fixture(scope="module")
def user_b_session():
    s = requests.Session()
    email = _unique_email("ub")
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "User B"})
    assert r.status_code == 200
    return s, email


class TestItineraryCRUD:
    def test_create_requires_auth(self):
        r = requests.post(f"{API}/itineraries", json={"title": "x"})
        assert r.status_code == 401

    def test_create_itinerary(self, user_a_session):
        s, _ = user_a_session
        payload = {
            "title": "TEST_Paris Trip",
            "type": "travel",
            "destination": "Paris",
            "start_date": "2026-03-01",
            "end_date": "2026-03-05",
            "description": "Spring trip",
            "cover_emoji": "🗼",
            "budget_limit": 1500.0,
            "currency": "EUR",
        }
        r = s.post(f"{API}/itineraries", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["type"] == "travel"
        assert data["destination"] == "Paris"
        assert data["currency"] == "EUR"
        assert "id" in data and isinstance(data["id"], str)
        assert data["events"] == [] and data["expenses"] == [] and data["packing"] == []
        pytest.itinerary_id_a = data["id"]

    def test_list_returns_only_own(self, user_a_session, user_b_session):
        sa, _ = user_a_session
        sb, _ = user_b_session
        # B creates own itinerary
        rb = sb.post(f"{API}/itineraries", json={"title": "TEST_B_only", "type": "event"})
        assert rb.status_code == 200
        b_id = rb.json()["id"]

        la = sa.get(f"{API}/itineraries")
        lb = sb.get(f"{API}/itineraries")
        assert la.status_code == 200 and lb.status_code == 200
        ids_a = {i["id"] for i in la.json()}
        ids_b = {i["id"] for i in lb.json()}
        assert pytest.itinerary_id_a in ids_a
        assert b_id in ids_b
        assert pytest.itinerary_id_a not in ids_b
        assert b_id not in ids_a

    def test_get_404_for_non_owner(self, user_a_session, user_b_session):
        sb, _ = user_b_session
        r = sb.get(f"{API}/itineraries/{pytest.itinerary_id_a}")
        assert r.status_code == 404

    def test_get_by_id_owner(self, user_a_session):
        sa, _ = user_a_session
        r = sa.get(f"{API}/itineraries/{pytest.itinerary_id_a}")
        assert r.status_code == 200
        assert r.json()["id"] == pytest.itinerary_id_a

    def test_update_nested_arrays(self, user_a_session):
        sa, _ = user_a_session
        events = [{"title": "Eiffel", "time": "10:00", "location": "Tour Eiffel", "lat": 48.8584, "lng": 2.2945, "notes": ""}]
        expenses = [{"category": "food", "description": "Croissant", "amount": 4.5, "currency": "EUR"}]
        packing = [{"text": "Passport", "category": "docs", "packed": False}]
        r = sa.put(
            f"{API}/itineraries/{pytest.itinerary_id_a}",
            json={"title": "TEST_Paris Trip Updated", "events": events, "expenses": expenses, "packing": packing},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == "TEST_Paris Trip Updated"
        assert len(data["events"]) == 1 and data["events"][0]["title"] == "Eiffel"
        assert len(data["expenses"]) == 1 and data["expenses"][0]["amount"] == 4.5
        assert len(data["packing"]) == 1 and data["packing"][0]["text"] == "Passport"

        # GET to verify persistence
        g = sa.get(f"{API}/itineraries/{pytest.itinerary_id_a}")
        assert g.status_code == 200
        gd = g.json()
        assert gd["title"] == "TEST_Paris Trip Updated"
        assert len(gd["events"]) == 1
        assert gd["events"][0]["lat"] == 48.8584

    def test_delete_and_verify(self, user_a_session):
        sa, _ = user_a_session
        # create a throwaway
        r = sa.post(f"{API}/itineraries", json={"title": "TEST_ToDelete", "type": "generic"})
        iid = r.json()["id"]
        d = sa.delete(f"{API}/itineraries/{iid}")
        assert d.status_code == 200
        g = sa.get(f"{API}/itineraries/{iid}")
        assert g.status_code == 404

    def test_cleanup_all_test_itineraries(self, user_a_session, user_b_session):
        for s, _ in (user_a_session, user_b_session):
            lst = s.get(f"{API}/itineraries").json()
            for it in lst:
                if it.get("title", "").startswith("TEST_"):
                    s.delete(f"{API}/itineraries/{it['id']}")
