import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PREFIXES = ['/', '/projecten', '/hoe-het-werkt', '/voor-opdrachtgevers', '/over-timmerly', '/prijzen', '/privacy', '/voorwaarden', '/support', '/verificatie', '/zzp-check', '/inloggen', '/registreren', '/verifieer', '/wachtwoord-vergeten', '/wachtwoord-herstellen', '/api/health', '/timmerman-gezocht'];

/**
 * Eerste poortwachter: geen sessiecookie → naar inloggen, met terugkeer-URL.
 * De echte controle (geldige sessie, rol, 2FA) gebeurt in de layouts en
 * server actions; dit voorkomt alleen onnodige renders.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')) || (p === '/projecten' && pathname.startsWith('/projecten/') && pathname !== '/projecten/nieuw'));
  if (isPublic) return NextResponse.next();
  if (!req.cookies.get('tm_session')) {
    const url = new URL('/inloggen', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Naast Next.js' eigen assets ook alles onder public/ (afbeeldingen, etc.) en
// veelvoorkomende statische bestandsextensies overslaan — die zijn altijd
// openbaar en horen nooit achter de sessiecheck te belanden.
export const config = {
  matcher: ['/((?!_next/static|_next/image|images/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpe?g|webp|gif|ico|css|js|woff2?|ttf|map)$).*)']
};
