const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function toUrl(path) {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${normalizedBase}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(toUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export function apiGetInventory() {
  return request('/api/inventory');
}

export function apiLogin(username, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function apiCreateBooking(payload) {
  return request('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function apiSubmitFeedback(payload) {
  return request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function apiGetActiveBookings() {
  return request('/api/bookings/active');
}

export function apiGetBlockedSlots() {
  return request('/api/blocks');
}

export function apiGetAdminBookings(token) {
  return request('/api/admin/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function apiCreateBlock(token, payload) {
  return request('/api/admin/blocks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function apiDeleteBlock(token, blockId) {
  return request(`/api/admin/blocks/${blockId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function apiDeleteBooking(token, bookingId) {
  return request(`/api/admin/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
