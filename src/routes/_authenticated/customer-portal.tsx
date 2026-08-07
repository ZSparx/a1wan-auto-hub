import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/customer-portal")({
  component: () => <Outlet />,
});
