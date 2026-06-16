import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-eam-key-12345';

/**
 * Creates a signed token for a user payload.
 */
export function signToken(payload, expiresIn = '24h') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Set expiration
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  const payloadStr = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${payloadStr}`)
    .digest('base64url');
    
  return `${header}.${payloadStr}.${signature}`;
}

/**
 * Verifies a token and returns the payload.
 */
export function verifyToken(token) {
  if (!token) return null;
  
  try {
    const [header, payloadStr, signature] = token.split('.');
    
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${header}.${payloadStr}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Helper to get the current authenticated user from cookies.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eam_session')?.value;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  // Optionally fetch full user from DB to ensure they still exist and get fresh role
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, organizationId: true, siteId: true }
  });
  
  return user;
}
