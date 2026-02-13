import { baseUrlFromRequest, json, methodNotAllowed } from './_lib/http.js';
import { inventory } from './_lib/inventory.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const baseUrl = baseUrlFromRequest(req);
  const normalized = inventory.map((item) => ({
    ...item,
    image: item.image.startsWith('http') ? item.image : `${baseUrl}${item.image}`,
    gallery: (item.gallery || []).map((photo) =>
      photo.startsWith('http') ? photo : `${baseUrl}${photo}`
    ),
  }));

  return json(res, 200, { inventory: normalized });
}
