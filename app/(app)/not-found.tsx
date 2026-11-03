import { NotFoundState } from "@/components/app/not-found-state";

/** Shown inside the app shell, so the sidebar and search stay available. */
export default function AppNotFound() {
  return <NotFoundState area="app" />;
}
