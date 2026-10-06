export interface Step {
  title: string;
  body: string;
}

/** A numbered how-to: each step a short title and a sentence or two. */
export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold-bg text-sm font-semibold text-gold-deep"
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <b className="block text-sm text-text">{step.title}</b>
            <p className="mt-0.5 text-sm text-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
