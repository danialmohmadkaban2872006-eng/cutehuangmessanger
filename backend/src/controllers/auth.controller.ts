// © Danial Mohmad — All Rights Reserved
import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, displayName } = req.body;
      if (!email || !password || !displayName) {
        res.status(400).json({ error: "email, password, and displayName are required" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }
      const result = await authService.register(email.toLowerCase().trim(), password, displayName.trim());
      res.status(201).json(result);
    } catch (err: any) {
      if (err.code === "EMAIL_TAKEN") { res.status(409).json({ error: err.message }); return; }
      console.error("[register]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) { res.status(400).json({ error: "email and password are required" }); return; }
      const result = await authService.login(email.toLowerCase().trim(), password);
      res.json(result);
    } catch (err: any) {
      if (err.code === "INVALID_CREDENTIALS") { res.status(401).json({ error: err.message }); return; }
      console.error("[login]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) { res.status(400).json({ error: "refreshToken required" }); return; }
      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await authService.me(req.user!.id);
      res.json(user);
    } catch {
      res.status(404).json({ error: "User not found" });
    }
  },
};
