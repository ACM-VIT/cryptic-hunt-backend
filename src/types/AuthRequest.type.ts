import { User } from "@prisma/client";
import express from "express";

export interface AuthRequest extends express.Request {
  user?: User;
}
