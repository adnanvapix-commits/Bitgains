/**
 * Disable console logs in production for security
 * This prevents API routes and sensitive information from being exposed in browser console
 */

export const disableConsoleInProduction = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Disable all console methods
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
};

// For development, you can also selectively disable logs
export const disableConsoleLogs = () => {
  if (typeof window !== 'undefined') {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
};
