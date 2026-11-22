import { createContext, useContext } from "react";

type AuthContextValue = {
  authenticated: boolean;
  setAuthenticated: (authenticated: boolean) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside the application.");
  }
  return context;
}
