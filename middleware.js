import { NextResponse } from 'next/server';
// import prohibitedCountries from '../data/prohibited-countries.json';

// const prohibitedCountriesCode = Object.values(prohibitedCountries);

const prohibitedCountriesCode = [undefined, 'IN'];

/**
 * Middleware to validate the country
 *
 * @param {NextRequest} request
 */
export default function validateCountryMiddleware(request) {
  const country = request.geo?.country;

  console.log({ country });

  // if already on the not-legal page, don't redirect
  if (request.nextUrl.pathname === '/not-legal') {
    return NextResponse.next();
  }

  // if country is prohibited, redirect to not-legal page
  if (prohibitedCountriesCode.includes(country)) {
    return NextResponse.redirect(new URL('/not-legal', request.url));
  }

  return NextResponse.next();
}
