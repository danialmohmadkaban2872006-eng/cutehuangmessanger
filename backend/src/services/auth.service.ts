// © Danial Mohmad — All Rights Reserved
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { generateUniqueAppId } from "../utils/appId";

<<<<<<< HEAD
// Fields safe to return to the client — no password, no internal tokens
const SAFE_USER_SELECT = {
=======
const USER_SELECT = {
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
  id: true, appId: true, email: true, displayName: true,
  avatar: true, bio: true, online: true, createdAt: true, updatedAt: true,
};

<<<<<<< HEAD
async function storeRefreshToken(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
}

export const authService = {
  async register(email: string, password: string, displayName: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Object.assign(new Error("Email already registered"), { code: "EMAIL_TAKEN" });
    }
=======
export const authService = {
  async register(email: string, password: string, displayName: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw Object.assign(new Error("Email already registered"), { code: "EMAIL_TAKEN" });
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada

    const hashed = await bcrypt.hash(password, 12);
    const appId = await generateUniqueAppId();

    const user = await prisma.user.create({
      data: { email, password: hashed, displayName, appId },
<<<<<<< HEAD
      select: SAFE_USER_SELECT,
=======
      select: USER_SELECT,
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    await storeRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string) {
<<<<<<< HEAD
    // Fetch including password for comparison — we strip it before returning
    const raw = await prisma.user.findUnique({ where: { email } });
    if (!raw) {
      throw Object.assign(new Error("Invalid email or password"), { code: "INVALID_CREDENTIALS" });
    }

    const valid = await bcrypt.compare(password, raw.password);
    if (!valid) {
      throw Object.assign(new Error("Invalid email or password"), { code: "INVALID_CREDENTIALS" });
    }

    // Update online status
    await prisma.user.update({ where: { id: raw.id }, data: { online: true } });

    // Return only safe fields
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: raw.id },
      select: SAFE_USER_SELECT,
    });
=======
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw Object.assign(new Error("Invalid credentials"), { code: "INVALID_CREDENTIALS" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw Object.assign(new Error("Invalid credentials"), { code: "INVALID_CREDENTIALS" });

    // Set online
    await prisma.user.update({ where: { id: user.id }, data: { online: true } });
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    await storeRefreshToken(user.id, refreshToken);

<<<<<<< HEAD
    return { user, accessToken, refreshToken };
  },

  async refresh(token: string) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_TOKEN" });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw Object.assign(new Error("Refresh token expired"), { code: "INVALID_TOKEN" });
    }

    // Rotate: delete old, issue new
=======
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  },

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_TOKEN" });
    }
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    await prisma.refreshToken.delete({ where: { token } });

    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });
    const newRefresh = signRefreshToken({ userId: payload.userId, email: payload.email });
    await storeRefreshToken(payload.userId, newRefresh);

    return { accessToken, refreshToken: newRefresh };
  },

  async me(userId: string) {
<<<<<<< HEAD
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });
  },
};
=======
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: USER_SELECT });
    return user;
  },
};

async function storeRefreshToken(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
}
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
