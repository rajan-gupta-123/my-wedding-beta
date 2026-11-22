import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ApiError, getSummary } from "../lib/api";
import { AddGuestPage } from "../features/guests/AddGuestPage";
import { GuestListPage } from "../features/guests/GuestListPage";
import { LoginPage } from "../features/auth/LoginPage";
import { AuthContext, useAuth } from "./auth-context";

function ProtectedRoute() {
  const { authenticated } = useAuth();
  const location = useLocation();

  return authenticated ? (
    <Routes>
      <Route path="/" element={<GuestListPage />} />
      <Route path="/guests/new" element={<AddGuestPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    getSummary()
      .then(() => setAuthenticated(true))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          setAuthenticated(false);
        } else {
          setSessionError(
            error instanceof Error ? error.message : "Could not check the session.",
          );
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return     <main className="page-shell"><p className="muted">Checking your session…</p></main>;
  }

  if (sessionError) {
    return (
      <main className="page-shell">
        <p className="alert" role="alert">{sessionError}</p>
        <p className="muted">Check that the API and MongoDB are running, then refresh.</p>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated }}>
      <Routes>
        <Route
          path="/login"
          element={authenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/*" element={<ProtectedRoute />} />
      </Routes>
    </AuthContext.Provider>
  );
}
