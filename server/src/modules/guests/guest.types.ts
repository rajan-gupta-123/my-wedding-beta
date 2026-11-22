import { ObjectId } from "mongodb";

export const RSVP_STATUSES = ["pending", "confirmed", "declined"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export type GuestDocument = {
  _id?: ObjectId;
  name: string;
  phone: string;
  address: string;
  status: RsvpStatus;
};
