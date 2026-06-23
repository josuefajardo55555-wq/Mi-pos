import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import docsChatRouter from "./docs-chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(docsChatRouter);

export default router;
