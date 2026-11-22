import assert from "node:assert/strict";
import test from "node:test";
import { addGuestSchema, createGuestDocument, updateStatusSchema } from "./validation";

test("guest creation requires nonblank contact fields and defaults status to pending", () => {
  const valid = addGuestSchema.parse({
    name: " Priya ",
    phone: "0000123",
    address: " 12 Example Lane ",
  });

  assert.deepEqual(valid, {
    name: "Priya",
    phone: "0000123",
    address: "12 Example Lane",
  });
  assert.equal(createGuestDocument(valid).status, "pending");
  assert.equal(addGuestSchema.safeParse({
    name: " ",
    phone: "0000123",
    address: "12 Example Lane",
  }).success, false);
  assert.equal(addGuestSchema.safeParse({
    name: "Priya",
    phone: "0000123",
    address: "12 Example Lane",
    status: "maybe",
  }).success, false);
});

test("RSVP updates accept only the supported statuses", () => {
  assert.equal(updateStatusSchema.safeParse({ status: "confirmed" }).success, true);
  assert.equal(updateStatusSchema.safeParse({ status: "maybe" }).success, false);
});
