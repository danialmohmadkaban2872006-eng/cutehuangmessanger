// © Danial Mohmad — All Rights Reserved
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          },
        }}
      />
    </AppProvider>
  </StrictMode>
);
