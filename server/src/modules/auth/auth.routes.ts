import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { getDatabase } from "../../db/mongo";
import { AdminDocument } from "./auth.types";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
}).strict();

const router = Router();

router.post("/login", async (request, response, next) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Enter a username and password." });
    return;
  }

  try {
    const admin = await getDatabase()
      .collection<AdminDocument>("admins")
      .findOne({ username: parsed.data.username });

    if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
      response.status(401).json({
        message: "Incorrect username or password. Please try again.",
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    request.session.adminId = admin._id.toString();
    await new Promise<void>((resolve, reject) => {
      request.session.save((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    response.status(200).json({ message: "Logged in." });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
