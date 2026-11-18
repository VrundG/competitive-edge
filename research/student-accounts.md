# Student accounts and challenge entry

The first page promotes a challenge-specific diagnostic before resource exploration. Economics checks 8 currently available skills; personal finance checks 23. These are coverage counts, not validated proficiency scales or complete competition syllabi. Previous combined diagnostics remain readable.

## API contract

All responses are JSON with `Cache-Control: no-store`. The existing private Sites gateway remains in front of these routes. No account is automatically created for a visitor.

| Route | Method | Input | Result |
| --- | --- | --- | --- |
| `/api/auth/register` | POST | `{username,password,region}` | 201 `{student:{id,username,region}}` and session cookie |
| `/api/auth/login` | POST | `{username,password}` | 200 `{student:{id,username,region}}` and rotated session cookie |
| `/api/auth/session` | GET | session cookie | 200 `{student:{id,username,region},regions:[...]}` or `{student:null,regions:[...]}` |
| `/api/auth/region` | POST | `{region}` and session cookie | 200 `{student:{id,username,region}}` |
| `/api/auth/logout` | POST | session cookie | 200 `{ok:true}`, session revoked and cookie cleared |

POST requests must send an Origin matching the request origin. Register/login require application/json. Usernames are trimmed and lowercased, 3–32 ASCII letters/digits/underscores starting with a letter. Passwords are 15–128 Unicode characters, at most 512 UTF-8 bytes. The request body limit is 4096 bytes. Duplicate usernames return 409; incorrect credentials return a generic 401; throttling returns 429 with Retry-After.

Registration also requires one server-approved broad region. The eight North Carolina regions named in the BFF/NCCEE partnership proposal are Northeast, North Central, Piedmont-Triad, Southwest, Northwest, Western, Sandhills, and Southeast. “Outside North Carolina” and “Prefer not to say” keep the data honest when none applies. Existing accounts retain a null region until the student selects one; the account UI makes that missing step visible. Region updates require a valid student session. The site does not collect a school, county, street address, or precise location for this measurement.

Regional reach can be aggregated without exposing individual accounts by joining `student_accounts.id` to `learner_progress.user_id` as `student:` plus the account ID and to `diagnostic_completions.user_id` the same way. Keep any reporting interface aggregate-only and access-controlled before adding it to a broader student release.

`GET /api/regional-reach` now returns the aggregate Regional Reach report. It requires the trusted Sites identity header to match one of the comma-separated IDs in the secret `ANALYTICS_ADMIN_USER_IDS` runtime variable. Student sessions never grant access. The report contains all eight North Carolina regions, including zero-count regions, plus a combined other-response total. It reports registrations, accounts with saved progress, accounts with a nonempty study sheet, learners with at least one completed diagnostic, and challenge-specific diagnostic counts. It never returns usernames, account IDs, answers, or individual activity rows.

Password hashes use @noble/hashes scrypt with N=16384, r=8, p=5, a random 16-byte salt, and 32-byte derived key. Verification is checked against Node's independent native implementation in tests. Parameters follow one of the [OWASP scrypt configurations](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Library reference: [noble-hashes](https://github.com/paulmillr/noble-hashes).

Sessions use random 32-byte tokens, store only SHA-256 token hashes, and expire after 24 hours. `__Host-student_session` is Secure, HttpOnly, SameSite=Lax, Path=/, with no Domain attribute. A successful login replaces the presented session. Logout revokes that session. Expired session and throttle records are cleaned on successful authentication.

A fixed 15-minute window allows up to 5 requests per normalized username and 20 per trusted platform identity (or the trusted Cloudflare client IP when no platform identity exists). These are abuse controls, not a substitute for operational monitoring. Multiple students behind one platform identity share its limit during the private pilot.

## Progress identity

A valid student session maps progress to `student:<account-id>`. No cookie preserves existing platform-account progress. An invalid/expired student cookie fails closed with 401 for progress, without reverting to another account. Previously saved platform progress is not automatically migrated into a new student account.

## Student interface

The website now includes accessible registration, login, account-status, and logout screens. Before an account transition, it finishes any pending progress save. It then clears in-memory study data and reloads the progress belonging to the new identity. The interface states that progress from the surrounding Site identity is not copied automatically into a student account.

## Next release

Add a deliberate recovery mechanism before inviting students to rely on accounts; there is currently no email collection, password reset, or recovery endpoint. Decide the student-access audience and account deletion process before a broader rollout. Do not bypass the private Sites gateway to expose the prototype.

Migration `0001_loud_lord_hawal.sql` adds accounts, sessions, and throttle tables without altering existing progress rows. The prior migration remains unchanged.
