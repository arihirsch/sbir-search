import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import "./index.css";
import App from './App.tsx'

// Initialize PostHog
if (import.meta.env.PROD) {
  posthog.init(
    import.meta.env.VITE_POSTHOG_PUBLIC_KEY,
    {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      // Enable debug mode in development
      debug: import.meta.env.DEV,
      // Disable in development
      loaded: (posthog) => {
        if (import.meta.env.DEV) posthog.opt_out_capturing()
      }
    }
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>
);
