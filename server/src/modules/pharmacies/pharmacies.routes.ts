import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./pharmacies.controller.js";
import {
  createLocationSchema,
  locationIdParams,
  updateLocationSchema,
  updatePharmacyProfileSchema,
} from "./pharmacies.schemas.js";

export const pharmaciesRouter = Router();

pharmaciesRouter.use(requireAuth, requireRole("PHARMACY"));

pharmaciesRouter.get("/me/profile", asyncHandler(controller.getProfile));
pharmaciesRouter.put(
  "/me/profile",
  validate({ body: updatePharmacyProfileSchema }),
  asyncHandler(controller.updateProfile),
);

pharmaciesRouter.get("/me/locations", asyncHandler(controller.listLocations));
pharmaciesRouter.post(
  "/me/locations",
  validate({ body: createLocationSchema }),
  asyncHandler(controller.createLocation),
);
pharmaciesRouter.put(
  "/me/locations/:id",
  validate({ params: locationIdParams, body: updateLocationSchema }),
  asyncHandler(controller.updateLocation),
);
pharmaciesRouter.delete(
  "/me/locations/:id",
  validate({ params: locationIdParams }),
  asyncHandler(controller.deleteLocation),
);
