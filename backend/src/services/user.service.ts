// © Danial Mohmad — All Rights Reserved
import prisma from "../config/prisma";

const USER_SELECT = {
  id: true, appId: true, email: true, displayName: true,
  avatar: true, bio: true, online: true, createdAt: true, updatedAt: true,
};

export const userService = {
  async searchByAppId(appId: string) {
    return prisma.user.findUnique({ where: { appId }, select: USER_SELECT });
  },

  async updateProfile(userId: string, updates: { displayName?: string; bio?: string; avatar?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: updates,
      select: USER_SELECT,
    });
  },

  async setOnline(userId: string, online: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { online, lastSeen: online ? undefined : new Date() },
    });
  },
};
