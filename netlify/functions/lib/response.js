/**
 * Response helpers for Netlify Functions
 */

import { CORS_HEADERS } from './cors.js';

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

export function ok(data, statusCode = 200) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(data) };
}

export function created(data) {
  return ok(data, 201);
}

export function noContent() {
  return { statusCode: 204, headers: CORS_HEADERS, body: '' };
}

export function error(message, statusCode = 400) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify({ error: message }) };
}

export function unauthorized(message = 'Não autorizado') {
  return error(message, 401);
}

export function forbidden(message = 'Sem permissão') {
  return error(message, 403);
}

export function notFound(message = 'Não encontrado') {
  return error(message, 404);
}

export function serverError(message = 'Erro interno do servidor') {
  return error(message, 500);
}
