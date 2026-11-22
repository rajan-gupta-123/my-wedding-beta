import "express-session";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
  }
}

export type AdminDocument = {
  username: string;
  passwordHash: string;
};
