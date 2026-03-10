// © Danial Mohmad — All Rights Reserved
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { userService } from "../services/user.service";

export const userController = {
  async searchByAppId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appId } = req.query as { appId: string };
      if (!appId) { res.status(400).json({ error: "appId query param required" }); return; }
      const user = await userService.searchByAppId(appId.toUpperCase());
      if (!user) { res.status(404).json({ error: "User not found" }); return; }
      res.json(user);
    } catch (err) {
      console.error("[searchByAppId]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async updateMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { displayName, bio } = req.body;
      const updates: { displayName?: string; bio?: string } = {};
      if (displayName !== undefined) updates.displayName = displayName.trim();
      if (bio !== undefined) updates.bio = bio;
      const user = await userService.updateProfile(req.user!.id, updates);
      res.json(user);
    } catch (err) {
      console.error("[updateMe]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) { res.status(400).json({ error: "No file uploaded" }); return; }
      const avatarUrl = `/uploads/${file.filename}`;
      await userService.updateProfile(req.user!.id, { avatar: avatarUrl });
      res.json({ avatarUrl });
    } catch (err) {
      console.error("[uploadAvatar]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
