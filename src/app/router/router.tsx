import { createBrowserRouter } from "react-router";
import App from "@/App";
import { AuthPage } from "@/features/authentication/components/AuthPage";
import { OnboardingWizard } from "@/features/profile/components/OnboardingWizard";
import { DashboardPage } from "@/features/opportunities/components/DashboardPage";
import { OpportunitiesPage } from "@/features/opportunities/components/OpportunitiesPage";
import { OpportunityDetailPage } from "@/features/opportunities/components/OpportunityDetailPage";
import { CalendarPage } from "@/features/opportunities/components/CalendarPage";
import { SavedPage } from "@/features/opportunities/components/SavedPage";
import { SearchPage } from "@/features/opportunities/components/SearchPage";
import { AppShell } from "@/app/layout/AppShell";
import { RequireProfile } from "@/app/layout/RequireProfile";

/**
 * Route tree, assembled here from routes each feature owns. `app/` composes;
 * it doesn't contain feature logic — see frontend/README.md's architecture
 * rules. Still a flat list at this size; will likely move to each feature
 * exporting its own route objects once there are enough of them to warrant it.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <AuthPage mode="login" />,
  },
  {
    path: "/register",
    element: <AuthPage mode="register" />,
  },
  {
    path: "/onboarding",
    element: <OnboardingWizard />,
  },
  {
    path: "/app",
    element: (
      <RequireProfile>
        <AppShell />
      </RequireProfile>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "opportunities", element: <OpportunitiesPage /> },
      { path: "opportunities/:id", element: <OpportunityDetailPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "saved", element: <SavedPage /> },
    ],
  },
]);
