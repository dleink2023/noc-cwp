import { verifySession } from './lib/session.js';

// Se ejecuta en TODAS las rutas excepto /api/*, login.html y archivos estáticos
// típicos (para no bloquear el propio formulario de login ni sus recursos).
export const config = {
  matcher: ['/((?!api|login.html|favicon.ico|robots.txt).*)'],
};

export default async function middleware(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  const secret = process.env.SESSION_SECRET;
  const valid = token ? await verifySession(secret, token) : false;

  if (!valid) {
    const url = new URL('/login.html', request.url);
    return Response.redirect(url, 302);
  }
  // sesión válida -> deja pasar la petición normalmente (no se retorna nada)
}
