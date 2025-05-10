import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Analytics } from '@vercel/analytics/react';

// Create QueryClientProvider to have React Query as our data fetching library
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Analytics />
  </QueryClientProvider>
);
