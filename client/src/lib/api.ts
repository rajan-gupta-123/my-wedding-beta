export type RsvpStatus = "pending" | "confirmed" | "declined";

export type GuestRow = {
  id: string;
  name: string;
  status: RsvpStatus;
};

export type Guest = GuestRow & {
  phone: string;
  address: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as {
    message?: string;
    field?: string;
  } & T;

  if (!response.ok) {
    throw new ApiError(
      payload.message ?? "The request could not be completed.",
      response.status,
      payload.field,
    );
  }

  return payload;
}

export function login(username: string, password: string): Promise<{ message: string }> {
  return request("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getGuests(): Promise<GuestRow[]> {
  return request("/api/guests");
}

export function getSummary(): Promise<{ confirmed: number }> {
  return request("/api/guests/summary");
}

export function addGuest(input: {
  name: string;
  phone: string;
  address: string;
  status: RsvpStatus;
}): Promise<Guest> {
  return request("/api/guests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateGuestStatus(id: string, status: RsvpStatus): Promise<Guest> {
  return request(`/api/guests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
