import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import "./index.css";
import App from './App.tsx'

// Initialize PostHog
if (import.meta.env.PROD) {
  posthog.init(
    import.meta.env.REACT_APP_PUBLIC_POSTHOG_KEY,
    {
      api_host: import.meta.env.REACT_APP_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
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
