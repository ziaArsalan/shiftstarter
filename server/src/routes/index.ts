import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { workersRouter } from "../modules/workers/workers.routes.js";
import { pharmaciesRouter } from "../modules/pharmacies/pharmacies.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/workers", workersRouter);
apiRouter.use("/pharmacies", pharmaciesRouter);
apiRouter.use("/admin", adminRouter);
