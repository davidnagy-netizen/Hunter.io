import { createBrowserRouter } from "react-router";
import { AssessmentPage } from "@/pages/assessment/AssessmentPage";
import { LandingPage } from "@/pages/landing/LandingPage";
import { AuthPage } from "@/pages/authentication/AuthPage";
import { VerifyEmailPage } from "@/pages/authentication/VerifyEmailPage";
import { OnboardingWizard } from "@/pages/profile/OnboardingWizard";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { DashboardPage } from "@/pages/opportunities/DashboardPage";
import { OpportunitiesPage } from "@/pages/opportunities/OpportunitiesPage";
import { OpportunityDetailPage } from "@/pages/opportunities/OpportunityDetailPage";
import { CalendarPage } from "@/pages/opportunities/CalendarPage";
import { SavedPage } from "@/pages/opportunities/SavedPage";
import { SearchPage } from "@/pages/opportunities/SearchPage";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { SystemPage } from "@/pages/admin/SystemPage";
import { UserHistoryPage } from "@/pages/admin/UserHistoryPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { PlusPage } from "@/pages/fundor-plus/PlusPage";
import { ContactsPage } from "@/pages/crm/ContactsPage";
import { InsightsPage } from "@/pages/crm/InsightsPage";
import { LeadsPage } from "@/pages/crm/LeadsPage";
import { ContactPage } from "@/pages/crm/ContactPage";
import { CrmLayout } from "@/features/crm/components/CrmLayout";
import { PipelinePage } from "@/pages/crm/PipelinePage";
import { AppShell } from "@/app/layout/AppShell";
import { ADMIN_NAV, APP_NAV } from "@/app/layout/navigation";
import { RequireAdmin } from "@/app/layout/RequireAdmin";
import { RequireProfile } from "@/app/layout/RequireProfile";

/**
 * Route tree, assembled here from routes each feature owns. `app/` composes;
 * it doesn't contain feature logic — see frontend/README.md's architecture
 * rules. Still a flat list at this size; will likely move to each feature
 * exporting its own route objects once there are enough of them to warrant it.
 */
export const router = createBrowserRouter([
  { path: "/verify-email", element: <VerifyEmailPage /> },
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/assess",
    element: <AssessmentPage />,
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
        <AppShell nav={APP_NAV} workspace="app" />
      </RequireProfile>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "opportunities", element: <OpportunitiesPage /> },
      { path: "opportunities/:id", element: <OpportunityDetailPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "saved", element: <SavedPage /> },
      { path: "plus", element: <PlusPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AppShell nav={ADMIN_NAV} workspace="admin" />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminOverviewPage /> },
      {
        path: "crm",
        element: <CrmLayout />,
        children: [
          { index: true, element: <PipelinePage /> },
          { path: "contacts", element: <ContactsPage /> },
          { path: "leads", element: <LeadsPage /> },
          { path: "insights", element: <InsightsPage /> },
        ],
      },
      { path: "crm/contact/:id", element: <ContactPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "users/:id", element: <UserHistoryPage /> },
      { path: "system", element: <SystemPage /> },
    ],
  },
]);
