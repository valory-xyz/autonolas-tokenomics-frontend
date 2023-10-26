import { NextResponse } from 'next/server';
// import prohibitedCountries from './data/prohibited-countries.json';

// const prohibitedCountriesCode = Object.values(prohibitedCountries);

/**
 * Middleware to validate the country
 *
 * @param {NextRequest} request
 */
export default function validateCountryMiddleware(request) {
  const country = request.geo?.country;

  if ([undefined].includes(country) && request.nextUrl.pathname !== '/_error') {
    const errorUrl = new URL('/_error', request.url);
    // errorUrl.searchParams.set('code', '451');
    // set status code to 451

    return NextResponse.redirect(errorUrl, { status: 451, statusText: 'Unavailable For Legal Reasons' });
  }

  return NextResponse.next();
}
