// © Danial Mohmad — All Rights Reserved
// Generates unique human-readable App IDs like "HU-482931"

import prisma from "../config/prisma";

export async function generateUniqueAppId(): Promise<string> {
  const PREFIX = "HU";
  for (let attempt = 0; attempt < 10; attempt++) {
    const num = Math.floor(100000 + Math.random() * 900000); // 6-digit
    const appId = `${PREFIX}-${num}`;
    const exists = await prisma.user.findUnique({ where: { appId } });
    if (!exists) return appId;
  }
  // Fallback: timestamp-based
  return `${PREFIX}-${Date.now().toString().slice(-7)}`;
}
