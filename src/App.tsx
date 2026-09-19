import { Link } from "react-router";
import { Badge, Button, CircularProgress, LanguageToggle, Panel } from "@/shared/components";
import { useCurrentUser, useIsAdmin, useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { useLogoutMutation } from "@/features/authentication/api/auth.queries";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { ProfileHistoryPanel } from "@/features/profile/components/ProfileHistoryPanel";

/**
 * Temporary showcase: proves the Tailwind theme, the shared primitives, and
 * (as of the `authentication`/`profile` slices) the real session/login flow
 * and company-profile flow against the Node server. This is not a real
 * screen — it gets replaced once a feature with an actual landing page
 * (`assessment` or `opportunities`) lands.
 */
function App() {
  const user = useCurrentUser();
  const isAdmin = useIsAdmin();
  const isSubscriber = useIsSubscriber();
  const logout = useLogoutMutation();
  const { profile } = useCompanyProfile();

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">HUNTER</h1>
            <p className="text-muted">Design system showcase — slice 2 (authentication)</p>
          </div>
          <LanguageToggle />
        </header>

        <Panel title="Session" subtitle="Reads GET /api/auth/me through React Query">
          {user ? (
            <div className="flex flex-col gap-2 text-sm">
              <p>
                Signed in as <b>{user.username}</b> ({user.role}
                {isAdmin ? ", admin" : ""}
                {isSubscriber ? ", subscriber" : ""})
              </p>
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => logout.mutate()}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login">
                <Button variant="gold" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="ghost" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </Panel>

        <Link to="/app" className="w-fit">
          <Button variant="dark">Open the app →</Button>
        </Link>

        <Panel title="Company profile" subtitle="Server-backed when signed in, browser-only otherwise">
          {profile ? (
            <div className="flex flex-col gap-2 text-sm">
              <p>
                <b>{profile.company}</b> — {profile.employees} employees, {profile.county}
              </p>
              <Link to="/onboarding" className="w-fit">
                <Button variant="ghost" size="sm">
                  Edit profile
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/onboarding">
              <Button variant="gold" size="sm">
                Set up company profile
              </Button>
            </Link>
          )}
        </Panel>

        <ProfileHistoryPanel />

        <Panel title="Buttons" subtitle="Variants ported from the legacy .btn-* classes">
          <div className="flex flex-wrap gap-3">
            <Button variant="gold">Gold</Button>
            <Button variant="dark">Dark</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="gold" size="sm">
              Small
            </Button>
            <Button variant="gold" disabled>
              Disabled
            </Button>
          </div>
        </Panel>

        <Panel title="Badges" subtitle="Semantic tones — eligibility verdicts map onto these later">
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">Eligible</Badge>
            <Badge tone="amber">Conditional</Badge>
            <Badge tone="red">Not eligible</Badge>
            <Badge tone="slate">Missing data</Badge>
            <Badge tone="gold">New</Badge>
            <Badge tone="blue">Info</Badge>
          </div>
        </Panel>

        <Panel title="Circular progress" subtitle="Generic ring — Hunter Score / Readiness Score wrap this later">
          <div className="flex flex-wrap gap-8">
            <CircularProgress value={87} color="var(--color-gold)">
              <span className="font-display text-2xl font-semibold text-gold-deep">87</span>
              <span className="text-xs text-muted">/ 100</span>
            </CircularProgress>
            <CircularProgress value={45} size={90} strokeWidth={8} color="var(--color-amber)">
              <span className="font-display text-lg font-semibold text-amber">45</span>
            </CircularProgress>
            <CircularProgress value={95} color="var(--color-green)">
              <span className="font-display text-2xl font-semibold text-green">95</span>
              <span className="text-xs text-muted">/ 100</span>
            </CircularProgress>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default App;
