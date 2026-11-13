import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { workersRouter } from "../modules/workers/workers.routes.js";
import { orgsRouter } from "../modules/orgs/orgs.routes.js";
import { chainsRouter } from "../modules/chains/chains.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/workers", workersRouter);
apiRouter.use("/orgs", orgsRouter);
apiRouter.use("/chains", chainsRouter);
apiRouter.use("/admin", adminRouter);
