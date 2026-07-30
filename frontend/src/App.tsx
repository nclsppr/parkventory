import { useEffect, useState } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export default function App() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.title = path === "/app"
      ? "Accueil — Parkventory"
      : "Parkventory — Le parking partagé, simplement";
  }, [path]);

  return path === "/app" ? <DashboardPage /> : <LandingPage />;
}
