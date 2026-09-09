"use client";

import { useEffect } from "react";

/**
 * Client component to disable console logs in the browser
 * This prevents API routes, logs, and sensitive information from being exposed
 * Also suppresses browser extension errors that don't affect functionality
 *
 * Set DEBUG_MODE = true to temporarily enable console for debugging
 */
export default function ConsoleDisabler() {
  useEffect(() => {
    // Set this to true to enable debugging
    const DEBUG_MODE = false;

    if (!DEBUG_MODE) {
      // Disable all console methods immediately
      console.log = () => {};
      console.warn = () => {};
      console.info = () => {};
      console.debug = () => {};

      // Keep console.error but filter out extension errors
      const originalError = console.error;
      console.error = (...args: unknown[]) => {
        const [firstArg] = args;
        let msg = "";

        if (typeof firstArg === "string") {
          msg = firstArg;
        } else if (
          typeof firstArg === "object" &&
          firstArg !== null &&
          "message" in firstArg &&
          typeof firstArg.message === "string"
        ) {
          msg = firstArg.message;
        } else if (firstArg !== undefined && firstArg !== null) {
          msg = String(firstArg);
        }
        // Only block extension-related errors
        if (!msg.includes("content_script") && !msg.includes("extension")) {
          originalError(...args);
        }
      };
    }

    // Suppress browser extension errors
    const originalError = window.onerror;
    window.onerror = function (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) {
      // Suppress content_script.js errors from browser extensions
      if (source && source.includes("content_script.js")) {
        return true; // Prevent error from showing in console
      }
      // Call original error handler if it exists
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Suppress unhandled promise rejections from extensions
    const originalRejection = window.onunhandledrejection;
    window.onunhandledrejection = function (event: PromiseRejectionEvent) {
      // Suppress if it's from a browser extension
      if (
        typeof event.reason === "object" &&
        event.reason !== null &&
        "stack" in event.reason &&
        typeof event.reason.stack === "string" &&
        event.reason.stack.includes("content_script.js")
      ) {
        event.preventDefault();
        return;
      }
      // Call original handler if it exists
      if (originalRejection) {
        originalRejection.call(window, event);
      }
    };

    // Cleanup
    return () => {
      window.onerror = originalError;
      window.onunhandledrejection = originalRejection;
    };
  }, []);

  return null; // This component doesn't render anything
}
