import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          appearance={{
            variables: {
              colorPrimary: "#2563eb",
              colorTextOnPrimaryBackground: "#ffffff",
              colorBackground: "#ffffff",
              colorInputBackground: "#f9fafb",
              colorInputText: "#111827",
              colorText: "#111827",
              colorTextSecondary: "#6b7280",
              colorDanger: "#ef4444",
              colorSuccess: "#10b981",
              fontFamily: "inherit",
              borderRadius: "0.75rem",
              fontSize: "15px",
            },
            elements: {
              // Card / Modal
              card: "shadow-2xl border border-gray-100 rounded-2xl",
              rootBox: "font-sans",

              // Header
              headerTitle: "text-2xl font-bold text-gray-900",
              headerSubtitle: "text-gray-500 text-sm",
              logoImage: "rounded-xl",

              // Primary button (Sign in / Continue)
              formButtonPrimary:
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] normal-case",

              // Social buttons (Google, GitHub etc.)
              socialButtonsBlockButton:
                "border border-gray-200 hover:bg-gray-50 rounded-xl font-medium text-gray-700 transition-colors",
              socialButtonsBlockButtonText: "font-medium",

              // Divider
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-400 text-xs",

              // Input fields
              formFieldInput:
                "rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all",
              formFieldLabel: "text-gray-700 font-medium text-sm",
              formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-600",

              // Footer links
              footerActionLink:
                "text-blue-600 hover:text-purple-600 font-medium transition-colors",
              footerActionText: "text-gray-500",

              // Internal nav links (Back, etc.)
              identityPreviewEditButton: "text-blue-600 hover:text-purple-600",

              // OTP / verification input
              otpCodeFieldInput:
                "rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold text-lg",

              // Alert / error box
              alertText: "text-sm",
              formFieldErrorText: "text-red-500 text-xs mt-1",

              // User button popup
              userButtonPopoverCard: "shadow-xl rounded-2xl border border-gray-100",
              userButtonPopoverActionButton:
                "hover:bg-blue-50 rounded-xl transition-colors",
              userButtonPopoverActionButtonText: "text-gray-700 font-medium",
              userButtonPopoverFooter: "border-t border-gray-100",
            },
          }}
        >
          <App />
        </ClerkProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);