# Auth Testing Playbook — Itinera

## MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
db.users.getIndexes()
db.login_attempts.getIndexes()
```
Verify bcrypt hashes start with `$2b$` and unique index exists on `users.email`.

## API Testing (cURL)
```
BASE=http://localhost:8001

# Login
curl -c cookies.txt -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@itinera.app","password":"admin123"}'

# Get current user
curl -b cookies.txt $BASE/api/auth/me

# Register
curl -c cookies2.txt -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@itinera.app","password":"demo12345","name":"Demo User"}'

# Create itinerary
curl -b cookies2.txt -X POST $BASE/api/itineraries \
  -H "Content-Type: application/json" \
  -d '{"title":"Tokyo trip","type":"travel","destination":"Tokyo","start_date":"2026-04-01","end_date":"2026-04-07"}'
```

## Expected
- Login returns user JSON and sets `access_token` + `refresh_token` httpOnly cookies.
- `/api/auth/me` returns user JSON using those cookies.
- 5 bad login attempts on same `ip:email` return 429.
