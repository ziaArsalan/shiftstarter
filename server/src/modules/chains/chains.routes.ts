import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePlatformRole, requireProfile } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { uploadLogo } from "../../middleware/upload.js";
import * as controller from "./chains.controller.js";
import { chainIdParams, createChainSchema, updateChainSchema } from "./chains.schemas.js";

/** Public catalog (any authenticated user) — mounted at /chains. */
export const chainsRouter = Router();
chainsRouter.use(requireAuth, requireProfile);
chainsRouter.get("/", asyncHandler(controller.listChains));

/** Super-admin CRUD — mounted at /admin/chains. */
export const adminChainsRouter = Router();
adminChainsRouter.use(requireAuth, requirePlatformRole("SUPER_ADMIN"));
adminChainsRouter.post(
  "/",
  validate({ body: createChainSchema }),
  asyncHandler(controller.createChain),
);
adminChainsRouter.put(
  "/:id",
  validate({ params: chainIdParams, body: updateChainSchema }),
  asyncHandler(controller.updateChain),
);
adminChainsRouter.delete(
  "/:id",
  validate({ params: chainIdParams }),
  asyncHandler(controller.deleteChain),
);
adminChainsRouter.post(
  "/:id/logo",
  validate({ params: chainIdParams }),
  uploadLogo,
  asyncHandler(controller.uploadLogo),
);
