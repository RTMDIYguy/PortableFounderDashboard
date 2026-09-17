import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must specify database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Authorized Executive Email Whitelist for Uncle Robert Consulting LLC & Agent Lab
export const AUTHORIZED_EXECUTIVES = [
  // Robert (Uncle Robert Consulting LLC / Agent Lab)
  'robert@unclerobertconsulting.com',
  'robert@agent-lab.tech',
  'thebossrob@gmail.com',
  'agentlab.tech@gmail.com',
  // Co-Founder Sheena Burns
  'burnssheena335@gmail.com',
  'sheena@unclerobertconsulting.com',
] as const;

export function isAuthorizedExecutiveEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_EXECUTIVES.some(e => e.toLowerCase() === normalized);
}

export function getExecutiveOrganization(email: string | null | undefined): string {
  if (!email) return 'Agent Lab & Uncle Robert Consulting LLC';
  const normalized = email.trim().toLowerCase();
  if (normalized.includes('unclerobertconsulting.com')) {
    return 'Uncle Robert Consulting LLC';
  }
  if (normalized.includes('agent-lab.tech')) {
    return 'Agent Lab';
  }
  return 'Agent Lab & Uncle Robert Consulting LLC';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Verify network connectivity.');
    }
  }
}

// Sync executive profile to Firestore upon verified sign-in
export async function syncExecutiveProfile(user: User) {
  if (!user.email || !isAuthorizedExecutiveEmail(user.email)) return;
  const path = `executive_profiles/${user.uid}`;
  try {
    const docRef = doc(db, 'executive_profiles', user.uid);
    await setDoc(docRef, {
      email: user.email.toLowerCase(),
      displayName: user.displayName || 'Executive Member',
      role: 'executive',
      organization: getExecutiveOrganization(user.email),
      lastLogin: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    // Non-blocking log using strict error format
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Intentionally caught to avoid blocking UI rendering
    }
  }
}

export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function logoutUser() {
  return await signOut(auth);
}
