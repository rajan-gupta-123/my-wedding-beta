import { z } from "zod";
import { RSVP_STATUSES } from "./guest.types";
import type { GuestDocument } from "./guest.types";

export const addGuestSchema = z.object({
  name: z.string().trim().min(1, "Enter a guest name."),
  phone: z.string().trim().min(1, "Enter a phone number."),
  address: z.string().trim().min(1, "Enter an address."),
  status: z.enum(RSVP_STATUSES).optional(),
}).strict();

export const updateStatusSchema = z.object({
  status: z.enum(RSVP_STATUSES, {
    error: "Choose Pending, Confirmed, or Declined.",
  }),
}).strict();

export function createGuestDocument(
  input: z.infer<typeof addGuestSchema>,
): GuestDocument {
  return {
    ...input,
    status: input.status ?? "pending",
  };
}

export function validationError(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): { field?: string; message: string } {
  const issue = issues[0];
  const field = issue?.path[0];
  return {
    ...(typeof field === "string" ? { field } : {}),
    message: issue?.message ?? "The request is invalid.",
  };
}
