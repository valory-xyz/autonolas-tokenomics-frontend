import { NextResponse } from 'next/server';

const invalidCounties = ['US'];

/**
 * Middleware to validate the country and address based on OFAC and other legal requirements
 *
 * @param {NextRequest} req
 */
export default function validateCountyAndAddressMiddleware(req) {
  const country = req.geo?.country;

  console.log({ req, country: req.geo?.country });

  if (invalidCounties.includes(country)) {
    return NextResponse.error('Blocked for legal reasons', { status: 451 });
  }

  return NextResponse.next();
}
