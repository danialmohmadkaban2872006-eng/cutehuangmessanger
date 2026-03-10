// © Danial Mohmad — All Rights Reserved
import { useApp } from "./context/AppContext";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import AppShell from "./components/AppShell";

export default function App() {
  const { page } = useApp();

  if (page === "landing") return <LandingPage />;
  if (page === "auth") return <AuthPage />;
  return <AppShell />;
}
