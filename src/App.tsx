import { Badge, Button, CircularProgress, Panel } from "@/shared/components";

/**
 * Temporary slice-1 showcase: proves the Tailwind theme and the shared
 * primitives render correctly against the ported design tokens. This is not
 * a real screen — it gets replaced once the first real feature (assessment
 * or authentication) lands its own routes.
 */
function App() {
  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header>
          <h1 className="font-display text-2xl font-semibold text-ink">HUNTER</h1>
          <p className="text-muted">Design system showcase — slice 1</p>
        </header>

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
