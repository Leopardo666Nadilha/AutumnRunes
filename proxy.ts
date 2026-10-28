import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    // Match all pathnames except API routes, Next.js internals and files with an extension,
    // so unprefixed URLs like /portfolio are redirected to the user's locale
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
