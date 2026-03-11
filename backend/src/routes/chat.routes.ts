// © Danial Mohmad — All Rights Reserved
import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", chatController.getChats);
router.post("/", chatController.createChat);
router.get("/:chatId/messages", chatController.getMessages);
router.post("/:chatId/messages", chatController.sendMessage);
router.post("/:chatId/media", upload.single("file"), chatController.sendMedia);
router.post("/:chatId/seen", chatController.markSeen);
router.delete("/messages/:messageId", chatController.deleteMessage);

export default router;
