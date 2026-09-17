import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  isAuthorizedExecutiveEmail, 
  getExecutiveOrganization,
  syncExecutiveProfile,
  testConnection,
  AUTHORIZED_EXECUTIVES 
} from '../firebase';
import { ShieldCheck, ShieldAlert, Lock, LogOut, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

interface Props {
  children: (props: {
    user: User;
    email: string;
    organization: string;
    onLogout: () => void;
  }) => React.ReactNode;
}

export const ExecutiveAuthGate: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);

      if (currentUser && currentUser.email && isAuthorizedExecutiveEmail(currentUser.email)) {
        await syncExecutiveProfile(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await loginWithGoogle();
      if (result.user && result.user.email && isAuthorizedExecutiveEmail(result.user.email)) {
        await syncExecutiveProfile(result.user);
      }
    } catch (err: any) {
      console.warn('Sign-in error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // 1. Initial Auth Loading State
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xs animate-pulse">
            Δ
          </div>
          <h2 className="text-sm font-bold text-slate-800 tracking-wider uppercase">
            Verifying Executive Security Clearance
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Connecting to Uncle Robert Consulting LLC &amp; Agent Lab Secure Auth...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Executive Portal Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          
          {/* Header & Badging */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md select-none">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight uppercase text-white">
                  Agent Lab OS
                </span>
                <span className="inline-flex items-center rounded-sm bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-700 uppercase tracking-widest">
                  Executive Overwatch
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Uncle Robert Consulting LLC &amp; Agent Lab
              </p>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6 mb-6">
            <div className="inline-flex items-center gap-1.5 rounded bg-slate-700/50 px-2.5 py-1 text-xs text-slate-300 mb-3 border border-slate-600">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold">Restricted Operational Command</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Executive Authentication Required
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This dashboard provides direct oversight into the Agent Lab OS, financial runway, client deployments, and operational telemetry. Access is strictly limited to authorized executives.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Sign in button */}
          <button
            id="btn-google-executive-signin"
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-3 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoggingIn ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating with Google...</span>
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </>
            )}
          </button>

          {/* Access Policy Summary */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Authorized Executive Directory
            </p>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Robert (Uncle Robert Consulting LLC / Agent Lab)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sheena Burns (Co-Founder)</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    );
  }

  const userEmail = user.email || '';
  const isAuthorized = isAuthorizedExecutiveEmail(userEmail);

  // 3. Authenticated but Unauthorized Account
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-800 border border-rose-900/60 rounded-xl p-8 shadow-2xl">
          
          <div className="w-12 h-12 bg-rose-950 border border-rose-800 text-rose-400 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h1 className="text-lg font-bold text-white tracking-tight">
            Access Restricted: Unauthorized Account
          </h1>

          <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-slate-700 font-mono text-xs text-rose-300">
            {userEmail || 'No email associated with account'}
          </div>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            This operational dashboard is strictly configured for executive members of <strong className="text-slate-200">Uncle Robert Consulting LLC</strong> and <strong className="text-slate-200">Agent Lab</strong>. Your Google account does not match the executive access clearance.
          </p>

          <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-700/60 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Approved Executive Accounts:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Robert (*@unclerobertconsulting.com, *@agent-lab.tech)</li>
              <li>Sheena Burns (*@unclerobertconsulting.com, burnssheena335@gmail.com)</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              id="btn-switch-account"
              onClick={handleGoogleSignIn}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-center"
            >
              Switch Account
            </button>
            <button
              id="btn-logout-unauthorized"
              onClick={handleLogout}
              className="border border-slate-600 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-center"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 4. Authorized Executive: Render Application
  const organization = getExecutiveOrganization(userEmail);

  return (
    <>
      {children({
        user,
        email: userEmail,
        organization,
        onLogout: handleLogout,
      })}
    </>
  );
};
