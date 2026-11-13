import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Providers } from "./app/providers";
import { AppShell, type NavItem } from "./components/AppShell";
import {
  RequireAuth,
  RequireOrg,
  RequireOrgOwner,
  RequireProvisioned,
  RequireSuperAdmin,
  RequireWorker,
} from "./features/auth/guards";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";
import { OnboardingPage } from "./features/auth/OnboardingPage";
import { WorkerDashboard } from "./features/worker/WorkerDashboard";
import { WorkerProfilePage } from "./features/worker/ProfilePage";
import { CredentialsPage } from "./features/worker/CredentialsPage";
import { OrgDashboard } from "./features/org/OrgDashboard";
import { OrgProfilePage } from "./features/org/OrgProfilePage";
import { MembersPage } from "./features/org/MembersPage";
import { LocationsPage } from "./features/org/LocationsPage";
import { AdminLayout } from "./features/admin/AdminLayout";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { UsersPage } from "./features/admin/UsersPage";
import { OrgsPage } from "./features/admin/OrgsPage";
import { CredentialQueuePage } from "./features/admin/CredentialQueuePage";
import { ChainsPage } from "./features/admin/ChainsPage";
import { Landing } from "./pages/Landing";
import { Forbidden } from "./pages/Forbidden";
import { NotFound } from "./pages/NotFound";

const workerNav: NavItem[] = [
  { to: "/worker", label: "Dashboard", end: true },
  { to: "/worker/profile", label: "Profile" },
  { to: "/worker/credentials", label: "Credentials" },
];

const orgNav: NavItem[] = [
  { to: "/org", label: "Dashboard", end: true },
  { to: "/org/profile", label: "Organization" },
  { to: "/org/members", label: "Members" },
  { to: "/org/locations", label: "Locations" },
];

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forbidden" element={<Forbidden />} />

          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <OnboardingPage />
              </RequireAuth>
            }
          />

          {/* Worker area */}
          <Route
            element={
              <RequireAuth>
                <RequireProvisioned>
                  <RequireWorker>
                    <AppShell items={workerNav} />
                  </RequireWorker>
                </RequireProvisioned>
              </RequireAuth>
            }
          >
            <Route path="/worker" element={<WorkerDashboard />} />
            <Route path="/worker/profile" element={<WorkerProfilePage />} />
            <Route path="/worker/credentials" element={<CredentialsPage />} />
          </Route>

          {/* Organization area */}
          <Route
            element={
              <RequireAuth>
                <RequireProvisioned>
                  <RequireOrg>
                    <AppShell items={orgNav} />
                  </RequireOrg>
                </RequireProvisioned>
              </RequireAuth>
            }
          >
            <Route path="/org" element={<OrgDashboard />} />
            <Route
              path="/org/profile"
              element={
                <RequireOrgOwner>
                  <OrgProfilePage />
                </RequireOrgOwner>
              }
            />
            <Route
              path="/org/members"
              element={
                <RequireOrgOwner>
                  <MembersPage />
                </RequireOrgOwner>
              }
            />
            <Route path="/org/locations" element={<LocationsPage />} />
          </Route>

          {/* Admin area */}
          <Route
            element={
              <RequireAuth>
                <RequireSuperAdmin>
                  <AdminLayout />
                </RequireSuperAdmin>
              </RequireAuth>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/orgs" element={<OrgsPage />} />
            <Route path="/admin/credentials" element={<CredentialQueuePage />} />
            <Route path="/admin/chains" element={<ChainsPage />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
