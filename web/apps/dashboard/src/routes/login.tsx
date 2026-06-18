import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm opacity-70">Login stub.</p>
    </main>
  );
}
