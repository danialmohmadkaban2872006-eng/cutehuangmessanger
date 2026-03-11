// © Danial Mohmad — All Rights Reserved
import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.use(requireAuth);

router.get("/search", userController.searchByAppId);
router.patch("/me", userController.updateMe);
router.post("/me/avatar", upload.single("avatar"), userController.uploadAvatar);

export default router;
