import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Providers } from "./app/providers";
import { AppShell } from "./components/AppShell";
import { RequireAuth, RequireRole } from "./features/auth/guards";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { WorkerDashboard } from "./features/worker/WorkerDashboard";
import { WorkerProfilePage } from "./features/worker/ProfilePage";
import { CredentialsPage } from "./features/worker/CredentialsPage";
import { PharmacyDashboard } from "./features/pharmacy/PharmacyDashboard";
import { BusinessProfilePage } from "./features/pharmacy/BusinessProfilePage";
import { LocationsPage } from "./features/pharmacy/LocationsPage";
import { AdminLayout } from "./features/admin/AdminLayout";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { UsersPage } from "./features/admin/UsersPage";
import { CredentialQueuePage } from "./features/admin/CredentialQueuePage";
import { Landing } from "./pages/Landing";
import { Forbidden } from "./pages/Forbidden";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Worker area */}
          <Route
            element={
              <RequireAuth>
                <RequireRole roles={["WORKER"]}>
                  <AppShell />
                </RequireRole>
              </RequireAuth>
            }
          >
            <Route path="/worker" element={<WorkerDashboard />} />
            <Route path="/worker/profile" element={<WorkerProfilePage />} />
            <Route path="/worker/credentials" element={<CredentialsPage />} />
          </Route>

          {/* Pharmacy area */}
          <Route
            element={
              <RequireAuth>
                <RequireRole roles={["PHARMACY"]}>
                  <AppShell />
                </RequireRole>
              </RequireAuth>
            }
          >
            <Route path="/pharmacy" element={<PharmacyDashboard />} />
            <Route path="/pharmacy/profile" element={<BusinessProfilePage />} />
            <Route path="/pharmacy/locations" element={<LocationsPage />} />
          </Route>

          {/* Admin area */}
          <Route
            element={
              <RequireAuth>
                <RequireRole roles={["ADMIN"]}>
                  <AdminLayout />
                </RequireRole>
              </RequireAuth>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/credentials" element={<CredentialQueuePage />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
