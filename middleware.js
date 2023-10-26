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

  if (['IN'].includes(country)) {
    return Response.json(
      { success: false, message: 'This country is not allowed to access this website due to legal reasons.' },
      { status: 451 },
    );
  }

  return NextResponse.next();
}
