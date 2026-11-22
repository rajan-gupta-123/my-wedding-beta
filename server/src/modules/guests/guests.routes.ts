import { ObjectId } from "mongodb";
import { Router } from "express";
import { getDatabase } from "../../db/mongo";
import { requireAdmin } from "../auth/auth.middleware";
import { GuestDocument } from "./guest.types";
import {
  addGuestSchema,
  createGuestDocument,
  updateStatusSchema,
  validationError,
} from "./validation";

const router = Router();

router.use(requireAdmin);

router.get("/", async (_request, response) => {
  const guests = await getDatabase()
    .collection<GuestDocument>("guests")
    .find({}, { projection: { name: 1, status: 1 } })
    .sort({ name: 1 })
    .toArray();

  response.status(200).json(
    guests.map((guest) => ({
      id: guest._id!.toString(),
      name: guest.name,
      status: guest.status,
    })),
  );
});

router.get("/summary", async (_request, response) => {
  const confirmed = await getDatabase()
    .collection<GuestDocument>("guests")
    .countDocuments({ status: "confirmed" });

  response.status(200).json({ confirmed });
});

router.post("/", async (request, response) => {
  const parsed = addGuestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json(validationError(parsed.error.issues));
    return;
  }

  const guest = createGuestDocument(parsed.data);
  const result = await getDatabase().collection<GuestDocument>("guests").insertOne(guest);

  response.status(201).json({
    id: result.insertedId.toString(),
    name: guest.name,
    phone: guest.phone,
    address: guest.address,
    status: guest.status,
  });
});

router.patch("/:id", async (request, response) => {
  if (!ObjectId.isValid(request.params.id)) {
    response.status(400).json({ message: "Guest ID is not valid." });
    return;
  }

  const parsed = updateStatusSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json(validationError(parsed.error.issues));
    return;
  }

  const guest = await getDatabase()
    .collection<GuestDocument>("guests")
    .findOneAndUpdate(
      { _id: new ObjectId(request.params.id) },
      { $set: { status: parsed.data.status } },
      { returnDocument: "after" },
    );

  if (!guest) {
    response.status(404).json({ message: "Guest could not be found." });
    return;
  }

  response.status(200).json({
    id: guest._id.toString(),
    name: guest.name,
    phone: guest.phone,
    address: guest.address,
    status: guest.status,
  });
});

export { router as guestsRouter };
