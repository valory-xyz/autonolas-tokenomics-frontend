import { NextResponse } from 'next/server';
import ofacSanctionedCounties from './data/ofac-sanctioned-countries.json';

const invalidCounties = Object.values((ofacSanctionedCounties));

/**
 * Middleware to validate the country and address based on OFAC and other legal requirements
 *
 * @param {NextRequest} request
 */
export default function validateCountyMiddleware(request) {
  const country = request.geo?.country;

  if (invalidCounties.includes(country)) {
    return NextResponse.error('Blocked for legal reasons', { status: 451 });
  }

  return NextResponse.next();
}
