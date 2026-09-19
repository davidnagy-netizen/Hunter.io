import { createBrowserRouter } from "react-router";
import App from "@/App";

/**
 * Placeholder route tree for slice 1 (design system only). Real routes are
 * added feature by feature; each feature will contribute its own route
 * objects here rather than this file growing a hardcoded list per screen.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);
