# Wedding Guest RSVP Tracker
## Product requirements · Version 1

### Goal

Give the wedding organizer one reliable answer before the wedding: **How many people have said they will attend?** The organizer records replies received by phone or message. Each guest record represents one person, including when family members share a phone number or address.

The development goal is to follow a single action from the browser through a Node.js API to MongoDB and back to the screen.

### One-time admin setup

Before first login, the organizer manually creates one admin record in MongoDB with a username and a salted password hash generated from the chosen password.

### Admin workflow

1. **Log in.** The login page asks for the admin username and password and sends them to POST /api/login. Node.js looks up the username in MongoDB and verifies the submitted password against the stored hash. On success, the API starts an admin session and the browser opens the Guest List. For an unknown username or incorrect password, the API returns 401 and the page displays “Incorrect username or password. Please try again.” The guest pages and guest API require an authenticated admin.
2. **Review the Guest List.** Show the confirmed total, each guest’s name and RSVP status, and an **Add Guest** button. When the list is empty, show “No guests added yet” and a confirmed count of 0.
3. **Add a guest.** Open a separate page with the four fields below and a **Save Guest** button. The admin can record an existing reply immediately or leave the status as Pending.
4. **Save.** The API checks the fields before inserting a guest document. If a field is missing or invalid, identify it on the form and retain the entries. On success, return to the list and display the new guest and current total.
5. **Update a reply.** From the Guest List, the admin can change a guest’s RSVP. After the API saves the change, show the saved status and refresh the confirmed count. If saving fails, show an error and keep the last saved status visible.

### Guest record

| Form field | Suggested MongoDB field | Requirement |
|---|---|---|
| Guest name | name | Mandatory text. Reject blank or whitespace-only input. |
| Phone number | phone | Mandatory text. Reject blank input. Preserve prefixes such as +91 and leading zeros. |
| Address | address | Mandatory text. Reject blank or whitespace-only input. |
| RSVP status | status | Allow pending, confirmed, or declined. Default to pending when adding a guest. Display the labels as Pending, Confirmed, and Declined. |

MongoDB assigns each guest a unique ID. Use that ID to update the correct person even when two people share a name or phone number.

### Counting rule

**Confirmed guests** equals the number of guest documents whose current status is confirmed. Pending means the guest has yet to reply. Declined means they have said they will not attend. For example, if three relatives share an address and only two confirm, the total includes two people.

### Proposed API for the first build

These route names are implementation suggestions. The Node.js API handles validation and database operations.

| Request | Purpose | Expected success |
|---|---|---|
| POST /api/login | Verify the admin’s credentials and start a session | 200 |
| GET /api/guests | Read the guest list | 200 and a list, initially empty |
| POST /api/guests | Validate and insert one guest | 201 and the saved guest with its ID |
| PATCH /api/guests/:id | Update one guest’s RSVP by ID | 200 and the updated guest |
| GET /api/guests/summary | Run countDocuments({ status: "confirmed" }) on the guests collection | 200 and a JSON object such as {"confirmed": 2} |

Return 400 for invalid guest input, 401 for invalid login or unauthenticated guest requests, and 404 when a valid guest ID does not match a record.

### Acceptance checks

Run the API sequence in Postman with the admin record in place and an empty guest list, then repeat the guest workflow in the browser.

1. Request the guest list before login. Expect 401. Try an unknown username and then the correct username with a wrong password. Verify both attempts return 401, display the same retry message in the browser, and leave the guest list protected. Log in with the manually configured credentials, request the list again, and verify the list is empty and the summary reports 0.
2. Try adding a guest with each mandatory field omitted in turn. Each attempt must identify the missing field and leave the database unchanged. In the browser, verify the other entries remain on the form.
3. Add Priya with a phone number and address, omitting the status. Verify the saved status is pending and the confirmed total remains 0.
4. Send PATCH for Priya’s ID with {"status":"confirmed"}. Request the summary and verify the total is 1. Repeat the same update and verify the total is still 1.
5. Add another person at Priya’s address and phone number, selecting Confirmed on the form. Verify both people appear and the total is 2.
6. Change Priya to Declined. Refresh the browser. Verify her saved status is Declined, the other guest is still Confirmed, and the total is 1.
7. Try an unsupported status in Postman. Verify the API returns 400 and the previous status and count are preserved.

Version 1 is ready when the admin can complete this flow through the browser and the API checks produce the expected results.
