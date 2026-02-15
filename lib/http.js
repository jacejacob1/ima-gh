export function json(res, status, body) {
  res.status(status).json(body);
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  json(res, 405, { message: 'Method not allowed.' });
}

export function badRequest(res, message) {
  json(res, 400, { message });
}

export function toIso(input) {
  return new Date(input).toISOString();
}

export function isValidDateRange(startInput, endInput) {
  const start = new Date(startInput).getTime();
  const end = new Date(endInput).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function baseUrlFromRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}
