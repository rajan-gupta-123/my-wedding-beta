import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, login } from "../../lib/api";
import { useAuth } from "../../app/auth-context";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(username, password);
      setAuthenticated(true);
      navigate("/", { replace: true });
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-frame">
        <section className="login-art" aria-label="Wedding invitation">
          <img
            alt="Ivory wedding invitation with dried flowers on textured paper"
            className="login-art-image"
            src="/images/login-invitation.jpg"
          />
          <div className="login-art-shade" aria-hidden="true" />
          <div className="login-edition">
            <span className="login-edition-mark" aria-hidden="true" />
            <span>Evening Gala Edition</span>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-content">
            <header className="login-intro">
              <p className="login-eyebrow">Guest List &amp; Seating Suite</p>
              <h1>Wedding Guest RSVP Tracker</h1>
              <h2>Admin login</h2>
            </header>

            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-field" htmlFor="username">
                <span>Username</span>
                <input
                  autoComplete="username"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>

              <label className="login-field" htmlFor="password">
                <span>Password</span>
                <span className="login-password-wrap">
                  <input
                    autoComplete="current-password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="login-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? (
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A10.7 10.7 0 0112 5c5.2 0 8.7 4.6 9.5 6-.3.6-1.3 2-3 3.5M6.2 6.2C3.9 7.6 2.7 9.5 2.5 11c.8 1.4 4.3 6 9.5 6 1 0 1.9-.2 2.8-.5" />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </span>
              </label>

              {error && (
                <p className="login-error" role="alert">
                  <span aria-hidden="true">!</span>
                  {error}
                </p>
              )}

              <button
                className="login-submit"
                disabled={submitting}
                type="submit"
              >
                <span>{submitting ? "Signing in…" : "Log in"}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
