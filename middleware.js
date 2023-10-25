import { PROHIBITED_COUNTRIES_LIST } from 'common-util/functions';
import { NextResponse } from 'next/server';

/**
 * Middleware to validate the country
 *
 * @param {NextRequest} request
 */
export default function validateCountryMiddleware(request) {
  const country = request.geo?.country;
  if (PROHIBITED_COUNTRIES_LIST.includes(country)) {
    return NextResponse.error('Blocked for legal reasons', { status: 451 });
  }

  return NextResponse.next();
}
