import { Button } from "@tokenomics/ui";

export interface HeroProps {
  heading: string;
  cta: string;
}

/**
 * React island mounted from an .astro page via a client:* directive.
 * Consumes the shared @tokenomics/ui kit to validate the
 * shared-React-kit-as-Astro-island contract from the design doc.
 */
export default function Hero({ heading, cta }: HeroProps) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-bold tracking-tight">{heading}</h1>
      <Button>{cta}</Button>
    </div>
  );
}
