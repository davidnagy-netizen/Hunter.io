import { createBrowserRouter } from "react-router";
import { AssessmentPage } from "@/features/assessment/components/AssessmentPage";
import { LandingPage } from "@/features/landing/components/LandingPage";
import { AuthPage } from "@/features/authentication/components/AuthPage";
import { VerifyEmailPage } from "@/features/authentication/components/VerifyEmailPage";
import { OnboardingWizard } from "@/features/profile/components/OnboardingWizard";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { DashboardPage } from "@/features/opportunities/components/DashboardPage";
import { OpportunitiesPage } from "@/features/opportunities/components/OpportunitiesPage";
import { OpportunityDetailPage } from "@/features/opportunities/components/OpportunityDetailPage";
import { CalendarPage } from "@/features/opportunities/components/CalendarPage";
import { SavedPage } from "@/features/opportunities/components/SavedPage";
import { SearchPage } from "@/features/opportunities/components/SearchPage";
import { AdminOverviewPage } from "@/features/admin/components/AdminOverviewPage";
import { SystemPage } from "@/features/admin/components/SystemPage";
import { UserHistoryPage } from "@/features/admin/components/UserHistoryPage";
import { UsersPage } from "@/features/admin/components/UsersPage";
import { PlusPage } from "@/features/fundor-plus/components/PlusPage";
import { ContactsPage } from "@/features/crm/components/ContactsPage";
import { InsightsPage } from "@/features/crm/components/InsightsPage";
import { LeadsPage } from "@/features/crm/components/LeadsPage";
import { ContactPage } from "@/features/crm/components/ContactPage";
import { CrmLayout } from "@/features/crm/components/CrmLayout";
import { PipelinePage } from "@/features/crm/components/PipelinePage";
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
