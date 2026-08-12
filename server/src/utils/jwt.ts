import jwt, { SignOptions } from "jsonwebtoken";

interface UserPayLoad {
  userId: string;
} // interface to define expected payload data

export const signToken = (payload: UserPayLoad): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"]; // Type safety to prevent typescript errors

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): UserPayLoad => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.verify(token, secret) as UserPayLoad;
};
