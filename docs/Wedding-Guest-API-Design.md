# Wedding Guest RSVP Tracker
## API design · Version 1

The organizer uses this API to sign in, record each invited person’s reply, and see how many people have confirmed before the wedding. The browser calls Node.js. Node.js verifies the admin session, validates guest requests, and reads or writes the MongoDB database `wedding_rsvp`.

### From screen to request

| Event | Request | What the browser does on success |
|---|---|---|
| Submit the login form | POST /api/login | Open the Guest List. |
| Open or refresh the Guest List | GET /api/guests and GET /api/guests/summary | Display the guest rows and confirmed total. The two reads can run in parallel. |
| Click Add Guest | No API call | Open the form with Pending selected. |
| Click Save Guest | POST /api/guests | Return to the Guest List and reload the rows and total. |
| Change a guest’s RSVP | PATCH /api/guests/:id | Apply the saved status to that row, then fetch the summary again. |

### Request and response contracts

Requests with a body use JSON and the header `Content-Type: application/json`. The examples use a session cookie and expose MongoDB’s `_id` as a string called `id`. All four guest endpoints require a valid admin session.

#### 1. Sign in · POST /api/login

Before first use, the organizer manually creates an account in `admins` with a username and salted password hash. The form submits the username and the password the admin typed. Node.js looks up that username, verifies the password against the stored hash, and starts a session only when both match.

| | Example |
|---|---|
| Request body | `{"username":"organizer","password":"<your-admin-password>"}` |
| Success | 200 OK, a session cookie, and `{"message":"Logged in."}` |
| Incorrect username or password | 401 Unauthorized and `{"message":"Incorrect username or password. Please try again."}` |

#### 2. List guests · GET /api/guests

Node.js reads guest IDs, names, and current statuses from `guests`. The ID lets the browser update the correct row even if two guests share a name. The request has no body. A successful read returns 200 OK. An empty list returns `[]`.

Example response after adding one guest:

```json
[{"id":"650000000000000000000001","name":"Priya","status":"pending"}]
```

#### 3. Read the confirmed total · GET /api/guests/summary

The request has no body. Node.js runs `guests.countDocuments({ status: "confirmed" })`. With one pending guest, the response is 200 OK with `{"confirmed":0}`. After that guest confirms, the same request returns `{"confirmed":1}`.

#### 4. Add one guest · POST /api/guests

| Field | Input rule |
|---|---|
| name | Required, nonblank string. |
| phone | Required, nonblank string. Preserve prefixes and leading zeros. |
| address | Required, nonblank string. Guests can share a phone number and address. |
| status | Optional on creation. Omit it to use pending, or send pending, confirmed, or declined. |

Example request:

```json
{"name":"Priya","phone":"0000000001","address":"12 Example Lane"}
```

After validation, Node.js inserts one guest document. It returns 201 Created with the saved guest, including the generated ID and the default status:

```json
{"id":"650000000000000000000001","name":"Priya","phone":"0000000001","address":"12 Example Lane","status":"pending"}
```

#### 5. Update an RSVP · PATCH /api/guests/:id

Replace `:id` with the ID returned by the list or create request. For Priya, the example path is `/api/guests/650000000000000000000001`. Supply the desired status in the body. Node.js accepts pending, confirmed, or declined and updates the matching document by its MongoDB ID.

| | Example |
|---|---|
| Request body | `{"status":"confirmed"}` |
| Success | 200 OK with `{"id":"650000000000000000000001","name":"Priya","phone":"0000000001","address":"12 Example Lane","status":"confirmed"}` |

Submitting confirmed twice leaves the total at one. Each update sets the guest’s current reply, and the summary counts the records that match.

### Error handling

| Response | When it applies | Frontend behavior |
|---|---|---|
| 400 Bad Request | Missing or blank required field, invalid RSVP, or malformed guest ID | Show the error and preserve the form entries. A field error can use `{"field":"phone","message":"Enter a phone number."}`. |
| 401 Unauthorized | Login fails, or a guest request has a missing or expired session | On login failure, show the credentials message above. For a guest request, return to the login page. |
| 404 Not Found | The RSVP update uses a well-formed ID with no matching guest | Show “Guest could not be found.” Refresh the list to reconcile the displayed rows. |

If an RSVP save fails, keep the last saved status visible. If the save succeeds but the summary request fails, keep the saved status and retry the summary read.

### Postman walkthrough

Start with the manually configured test admin and an empty guest list. Set a Postman variable named `baseUrl` to your running Node.js server address. Send every request to that same host so Postman can reuse the login cookie.

1. Send GET `{{baseUrl}}/api/guests` before login. Expect 401.
2. Send POST `{{baseUrl}}/api/login` with an incorrect password, then with the correct credentials. Expect 401 followed by 200.
3. Read the guest list and summary. Expect `[]` and `{"confirmed":0}`.
4. Send the example create request without the phone field. Expect 400. Add the phone and send again. Expect 201 and pending. Copy the returned ID into a Postman variable named `guestId`.
5. Send PATCH `{{baseUrl}}/api/guests/{{guestId}}` with `{"status":"confirmed"}`. Read the summary and expect 1. Repeat the PATCH and read again. Expect 1.
6. Add Arun with the same phone and address, selecting confirmed. Expect the total to rise to 2. Change Priya to declined and read both endpoints again. Expect Arun to remain confirmed and the total to be 1.
7. Try updating Priya to an unsupported status. Expect 400. Try an unused, well-formed guest ID. Expect 404. Verify the list and count still reflect the last successful change.
