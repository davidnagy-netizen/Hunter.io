import { createBrowserRouter } from "react-router";
import App from "@/App";
import { AuthPage } from "@/features/authentication/components/AuthPage";

/**
 * Route tree, assembled here from routes each feature owns. `app/` composes;
 * it doesn't contain feature logic — see frontend/README.md's architecture
 * rules. Still a flat list at this size; will likely move to each feature
 * exporting its own route objects once there are enough of them to warrant it.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <AuthPage mode="login" />,
  },
  {
    path: "/register",
    element: <AuthPage mode="register" />,
  },
]);
