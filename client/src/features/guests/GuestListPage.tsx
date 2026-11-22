import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, getGuests, getSummary, updateGuestStatus } from "../../lib/api";
import type { GuestRow, RsvpStatus } from "../../lib/api";

const statuses: RsvpStatus[] = ["pending", "confirmed", "declined"];

function displayStatus(status: RsvpStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function GuestListPage() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [confirmed, setConfirmed] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [guestRows, summary] = await Promise.all([getGuests(), getSummary()]);
      setGuests(guestRows);
      setConfirmed(summary.confirmed);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(caught instanceof Error ? caught.message : "Could not load the guest list.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleStatusChange(id: string, status: RsvpStatus) {
    const savedGuest = guests.find((guest) => guest.id === id);
    if (!savedGuest) {
      return;
    }

    setSavingId(id);
    setError("");
    setNotice("");
    try {
      const updated = await updateGuestStatus(id, status);
      setGuests((current) =>
        current.map((guest) =>
          guest.id === updated.id ? { ...guest, status: updated.status } : guest,
        ),
      );
      try {
        const summary = await getSummary();
        setConfirmed(summary.confirmed);
      } catch (summaryError: unknown) {
        if (summaryError instanceof ApiError && summaryError.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        const detail = summaryError instanceof Error ? ` ${summaryError.message}` : "";
        setNotice(`RSVP saved, but the confirmed total could not refresh.${detail} Reload to try again.`);
      }
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(caught instanceof Error ? caught.message : "Could not update this RSVP.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Wedding guest book</p>
          <h1>Guest list</h1>
        </div>
        <Link className="button button-primary" to="/guests/new">Add guest</Link>
      </header>

      <section className="summary-card" aria-live="polite">
        <span className="summary-number">{confirmed ?? "—"}</span>
        <span className="summary-label">Confirmed guests</span>
      </section>

      {error && <p className="alert" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}

      <section className="card guest-card">
        <div className="section-heading">
          <h2>Invited guests</h2>
          {!loading && <span className="muted">{guests.length} total</span>}
        </div>
        {loading ? (
          <p className="muted">Loading guests…</p>
        ) : guests.length === 0 ? (
          <div className="empty-state">
            <p>No guests added yet.</p>
            <Link to="/guests/new">Add your first guest</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Guest name</th>
                  <th scope="col">RSVP status</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    <td>{guest.name}</td>
                    <td>
                      <label className="visually-hidden" htmlFor={`status-${guest.id}`}>
                        RSVP status for {guest.name}
                      </label>
                      <select
                        className={`status-select status-${guest.status}`}
                        disabled={savingId === guest.id}
                        id={`status-${guest.id}`}
                        value={guest.status}
                        onChange={(event) =>
                          void handleStatusChange(guest.id, event.target.value as RsvpStatus)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{displayStatus(status)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
