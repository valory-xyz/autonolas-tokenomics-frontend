import { NextResponse } from 'next/server';
import prohibitedCountries from './data/prohibited-countries.json';

const prohibitedCountriesCode = Object.values(prohibitedCountries);

/**
 * Middleware to validate the country
 *
 * @param {NextRequest} request
 */
export default function validateCountryMiddleware(request) {
  const country = request.geo?.country;

  if (prohibitedCountriesCode.includes(country)) {
    return NextResponse.json(
      {
        message: 'This country is not allowed to access this website due to legal reasons.',
        status_code: 451,
      },
      { status: 451 },
    );
  }

  return NextResponse.next();
}
