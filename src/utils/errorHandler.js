/**
 * Extract user-friendly error message from Convex errors
 * Convex errors store the message in the 'data' property
 */
export const getErrorMessage = (error, fallback = 'An error occurred') => {
  // Convex error format: error.data contains the message
  if (error?.data) {
    return error.data;
  }
  
  // Regular error message
  if (error?.message) {
    return error.message.split('\n')[0];
  }
  
  // Fallback
  return fallback;
};
