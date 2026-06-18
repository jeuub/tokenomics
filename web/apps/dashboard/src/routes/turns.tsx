import { createFileRoute, Outlet } from "@tanstack/react-router";

// Pathless layout for the /turns subtree: /turns/ → the ledger (turns.index),
// /turns/$turn → the drill-in. Each child renders its own full AppShell, so the
// layout is just an Outlet (this keeps the detail a full-page replace, not nested).
export const Route = createFileRoute("/turns")({ component: () => <Outlet /> });
