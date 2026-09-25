import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { router } from "@/app/router/router";
import { RegulatoryDisclaimer } from "@/components/RegulatoryDisclaimer";
import "@/i18n/i18n";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <RegulatoryDisclaimer />
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
);
