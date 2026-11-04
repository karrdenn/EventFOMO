import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Role, UserProfile } from '../types';

type SignUpData = {
  fullName: string;
  studentId: string;
  email: string;
  password: string;
  role: Role;
  year: string;
  club: string;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    // Runs whenever someone logs in or out (and once when the app starts).
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      unsubProfile?.();
      unsubProfile = undefined;
      setUser(u);

      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      // Listen to the user's profile document so it appears as soon as it is saved.
      unsubProfile = onSnapshot(
        doc(db, 'users', u.uid),
        (snap) => {
          setProfile(snap.exists() ? ({ uid: u.uid, ...snap.data() } as UserProfile) : null);
          setLoading(false);
        },
        () => {
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  const signUp = async (d: SignUpData) => {
    const cred = await createUserWithEmailAndPassword(auth, d.email.trim(), d.password);
    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName: d.fullName.trim(),
        studentId: d.studentId.trim(),
        email: d.email.trim().toLowerCase(),
        role: d.role,
        year: d.role === 'student' ? d.year : '',
        club: d.role === 'student' ? d.club : '',
        photoUrl: '',
        expoPushToken: '',
        prefs: {
          allow: true,
          newEvents: true,
          reminders: true,
          mandatory: true,
          updates: true,
          leadMinutes: 60,
        },
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // If saving the profile fails, remove the half-created account so they can retry.
      await deleteUser(cred.user);
      throw e;
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, logOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}