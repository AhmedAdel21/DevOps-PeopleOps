import React from 'react';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Auth guard wrapper. Currently passes through all children.
 * Will check selectIsAuthenticated and selectSessionRestored
 * once the auth slice is implemented.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  return <>{children}</>;
};
