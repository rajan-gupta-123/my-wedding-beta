# Wedding Guest RSVP Tracker
## MongoDB database design · Version 1 · For review

### Purpose and scope

One organizer manages the guest list for one wedding. The dashboard answers “How many people have confirmed before the wedding?” The proposed database name is `wedding_rsvp`. It contains two application collections. A collection groups documents, and each document describes one account or one person.

| Collection | One document represents | How it is created |
|---|---|---|
| admins | The organizer’s login account | The organizer manually adds the account before first login. |
| guests | One invited person and their current RSVP | The organizer saves the Add Guest form. |

### Admin account

| Field | MongoDB type | Rule |
|---|---|---|
| _id | ObjectId | MongoDB-generated identifier. |
| username | String | Required and nonblank. A unique index enforces one account per username and supports login lookup. |
| passwordHash | String | Required. Store an encoded salted password hash generated from the chosen password. Only the backend uses it. |

### Guest record

| Field | MongoDB type | Rule |
|---|---|---|
| _id | ObjectId | MongoDB-generated identifier. Use this to select a guest for an update. |
| name | String | Required. Reject empty or whitespace-only input. Duplicate names are allowed. |
| phone | String | Required and nonblank. Keep country prefixes and leading zeros. Family members may share a number. |
| address | String | Required and nonblank. Family members may share an address. |
| status | String | Required in the saved document. Allowed values are pending, confirmed, and declined. Node.js supplies pending when the form omits the status. |

The admin manages the entire guest list. A guest belongs to the wedding, so the single-wedding design needs no link from each guest to the admin. The dashboard calculates its total from guest records. For this small list, the proposed guest collection uses the standard unique index on _id.

### Page and database workflow

| Admin action | Node.js and MongoDB operation | Result on screen |
|---|---|---|
| Submit username and password | Find the admin by username. Verify the submitted password against the saved hash. Start a session only on success. | Success opens Guest List. An unknown username or incorrect password shows “Incorrect username or password. Please try again.” |
| Open Guest List | Check the admin session. Read the guest records and count records where status equals confirmed. | Show guest names, RSVP statuses, and the confirmed total. An empty list shows 0. |
| Save a new guest | Check the session, validate the fields, apply the default status if needed, and insert one guest document. | Return to the list after a successful save. For a validation error, identify the field and retain the entries. |
| Change an RSVP | Check the session, find the guest by _id, and set the new status. Refresh the confirmed count after the save succeeds. | Show the saved status and updated total. On failure, retain the last saved status and show an error. |

### Example for review

Priya and Arun share the same phone number and address. Their separate guest documents let the organizer record their replies independently.

| Action | Priya | Arun | Confirmed total |
|---|---|---|---|
| Add both guests before they reply | Pending | Pending | 0 |
| Priya confirms | Confirmed | Pending | 1 |
| Save Priya as Confirmed again | Confirmed | Pending | 1 |
| Arun confirms | Confirmed | Confirmed | 2 |
| Priya later declines | Declined | Confirmed | 1 |

The count always represents people whose current reply is Confirmed. Session storage is a later implementation choice. If sessions are stored in MongoDB, the session library may manage a separate technical collection.
