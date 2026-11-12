const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const TOKEN_KEY = 'vet_token';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & { json?: unknown };

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { json, headers: extraHeaders, ...rest } = options;
  const headers = new Headers(extraHeaders);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (json !== undefined) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Intenta de nuevo.');
  }

  // Sesión vencida: limpiamos el token y volvemos al login
  if (
    res.status === 401 &&
    typeof window !== 'undefined' &&
    !path.startsWith('/auth/login')
  ) {
    localStorage.removeItem(TOKEN_KEY);
    if (window.location.pathname !== '/login') window.location.href = '/login';
  }

  if (!res.ok) {
    let message = res.statusText || 'Error inesperado';
    try {
      const data = await res.json();
      message = Array.isArray(data.message)
        ? data.message.join(', ')
        : (data.message ?? message);
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Quita los campos vacíos (para crear registros). */
export function clean<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== '' && v !== undefined && v !== null,
    ),
  ) as Partial<T>;
}

/** Convierte '' en null (para editar y poder vaciar un campo). */
export function nullify<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v]),
  );
}
