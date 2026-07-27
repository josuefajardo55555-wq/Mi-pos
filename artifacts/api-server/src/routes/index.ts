import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import docsChatRouter from "./docs-chat";
import analyzeBoleta from "./analyze-boleta";
import backupInventory from "./backup-inventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(docsChatRouter);
router.use(analyzeBoleta);
router.use(backupInventory);

export default router;
