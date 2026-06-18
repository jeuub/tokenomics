import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

// Context shape available to every route's beforeLoad/loader.
export interface RouterContext {
  queryClient: QueryClient;
}

// Double-call factory: createRootRouteWithContext<Context>()({ ...options }).
export const Route = createRootRouteWithContext<RouterContext>()({
  // AUTH GUARD STUB:
  // Real protected sections should live under a pathless layout route
  // (e.g. src/routes/_authed.tsx) whose beforeLoad checks auth and does:
  //
  //   beforeLoad: ({ context, location }) => {
  //     if (!context.auth?.isAuthenticated) {
  //       throw redirect({ to: '/login', search: { redirect: location.href } })
  //     }
  //   }
  //
  // (auth would be added to RouterContext above and passed in src/router.tsx).
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen font-mono">
      <Outlet />
    </div>
  );
}
