import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@tokenomics/ui";

export const Route = createFileRoute("/")({
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">tokenomics</h1>
      <p className="mt-2 text-sm opacity-70">Dashboard — coming soon.</p>
      <div className="mt-6">
        <Button>Get started</Button>
      </div>
    </main>
  );
}
