import jwt from 'jsonwebtoken';
import { json } from './http.js';

const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-in-production';

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return '';
  return token;
}

export function requireAuth(req, res, roles = []) {
  const token = getBearerToken(req);
  if (!token) {
    json(res, 401, { message: 'Missing or invalid token.' });
    return null;
  }

  try {
    const user = verifyAuthToken(token);
    if (roles.length && !roles.includes(user.role)) {
      json(res, 403, { message: 'Insufficient permissions.' });
      return null;
    }
    return user;
  } catch {
    json(res, 401, { message: 'Token expired or invalid.' });
    return null;
  }
}
