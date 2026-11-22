import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, addGuest } from "../../lib/api";
import type { RsvpStatus } from "../../lib/api";

export function AddGuestPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("pending");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldError("");
    setSubmitting(true);

    try {
      await addGuest({ name, phone, address, status });
      navigate("/", { replace: true });
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (caught instanceof ApiError && caught.field) {
        setFieldError(caught.field);
      }
      setError(caught instanceof Error ? caught.message : "Could not save this guest.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Wedding guest book</p>
          <h1>Add a guest</h1>
        </div>
        <Link className="button button-secondary" to="/">Back to guest list</Link>
      </header>

      <section className="card form-card">
        <p className="muted">Add one person at a time. Guests can share contact details.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Guest name
            <input
              aria-invalid={fieldError === "name"}
              autoComplete="name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Phone number
            <input
              aria-invalid={fieldError === "phone"}
              autoComplete="tel"
              inputMode="tel"
              name="phone"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label>
            Address
            <textarea
              aria-invalid={fieldError === "address"}
              autoComplete="street-address"
              name="address"
              required
              rows={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>
          <label>
            RSVP status
            <select
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as RsvpStatus)}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
            </select>
          </label>
          {error && <p className="alert" role="alert">{error}</p>}
          <div className="form-actions">
            <Link className="button button-secondary" to="/">Cancel</Link>
            <button className="button button-primary" disabled={submitting} type="submit">
              {submitting ? "Saving…" : "Save guest"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
