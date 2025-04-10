import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: "JWT Secret not defined in .env" });
    }
    jwt.verify(token, secret);
    next();
    return;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
