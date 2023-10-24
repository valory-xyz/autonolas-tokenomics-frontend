import { NextResponse } from 'next/server';
import { isCountryProhibited } from '@autonolas/frontend-library';

/**
 * Middleware to validate the country
 *
 * @param {NextRequest} request
 */
export default function validateCountryMiddleware(request) {
  const country = request.geo?.country;

  if (isCountryProhibited(country)) {
    return NextResponse.error('Blocked for legal reasons', { status: 451 });
  }

  return NextResponse.next();
}
