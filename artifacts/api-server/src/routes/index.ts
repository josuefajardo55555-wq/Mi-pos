import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import docsChatRouter from "./docs-chat";
import analyzeBoleta from "./analyze-boleta";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(docsChatRouter);
router.use(analyzeBoleta);

export default router;
