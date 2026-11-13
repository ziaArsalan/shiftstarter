import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireOrgRole, requireProfile } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./orgs.controller.js";
import {
  createLocationSchema,
  inviteMemberSchema,
  locationIdParams,
  memberIdParams,
  updateLocationSchema,
  updateOrgSchema,
} from "./orgs.schemas.js";

export const orgsRouter = Router();

orgsRouter.use(requireAuth, requireProfile);

const ownerOnly = requireOrgRole("OWNER");
const ownerOrManager = requireOrgRole("OWNER", "MANAGER");

// Org profile: both roles can read; only owners edit (incl. chain selection).
orgsRouter.get("/me", ownerOrManager, asyncHandler(controller.getOrg));
orgsRouter.put("/me", ownerOnly, validate({ body: updateOrgSchema }), asyncHandler(controller.updateOrg));

// Members: owner-only.
orgsRouter.get("/me/members", ownerOnly, asyncHandler(controller.listMembers));
orgsRouter.post(
  "/me/members",
  ownerOnly,
  validate({ body: inviteMemberSchema }),
  asyncHandler(controller.inviteMember),
);
orgsRouter.delete(
  "/me/members/:id",
  ownerOnly,
  validate({ params: memberIdParams }),
  asyncHandler(controller.removeMember),
);

// Locations: owner or manager.
orgsRouter.get("/me/locations", ownerOrManager, asyncHandler(controller.listLocations));
orgsRouter.post(
  "/me/locations",
  ownerOrManager,
  validate({ body: createLocationSchema }),
  asyncHandler(controller.createLocation),
);
orgsRouter.put(
  "/me/locations/:id",
  ownerOrManager,
  validate({ params: locationIdParams, body: updateLocationSchema }),
  asyncHandler(controller.updateLocation),
);
orgsRouter.delete(
  "/me/locations/:id",
  ownerOrManager,
  validate({ params: locationIdParams }),
  asyncHandler(controller.deleteLocation),
);
