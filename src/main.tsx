import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RoleProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </RoleProvider>
    </ThemeProvider>
  </StrictMode>
);
