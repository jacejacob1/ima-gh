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

export function apiRequestGuestOtp(payload) {
  return request('/api/guest/auth?action=request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function apiVerifyGuestOtp(payload) {
  return request('/api/guest/auth?action=verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function apiGetGuestBookings(token) {
  return request('/api/guest/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function apiGetGuestInvoiceMeta(token, bookingId) {
  return request(`/api/guest/bookings?bookingId=${encodeURIComponent(bookingId)}&mode=json`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiDownloadGuestInvoice(token, bookingId) {
  const response = await fetch(toUrl(`/api/guest/bookings?bookingId=${encodeURIComponent(bookingId)}&download=true`), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Unable to download invoice');
  }

  return response.blob();
}

export function apiGetActiveBookings() {
  return request('/api/bookings');
}

export function apiGetBlockedSlots() {
  return request('/api/blocks');
}

export function apiGetAdminBookings(token) {
  return request('/api/admin/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function apiGetAdminAnalytics(token) {
  return request('/api/admin/analytics', {
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
  return request(`/api/admin/blocks?id=${encodeURIComponent(blockId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function apiDeleteBooking(token, bookingId) {
  return request(`/api/admin/bookings?id=${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
