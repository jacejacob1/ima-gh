import bcrypt from 'bcryptjs';
import { signAuthToken } from '../../lib/auth.js';
import { query } from '../../lib/db.js';
import { badRequest, json, methodNotAllowed } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return badRequest(res, 'Username and password are required.');
  }

  const result = await query(
    'SELECT id, username, password_hash, role FROM users WHERE username = $1',
    [String(username).trim()]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return json(res, 401, { message: 'Invalid credentials.' });
  }

  const token = signAuthToken(user);

  return json(res, 200, {
    token,
    user: {
      username: user.username,
      role: user.role,
    },
  });
}
