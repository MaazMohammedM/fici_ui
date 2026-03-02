import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserCredential } from '../lib/firebase';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, googleProvider, db, doc, getDoc } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, fullName: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        fetchUserRole(currentUser.uid);
      }
      setLoading(false);
    };
    init();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) fetchUserRole(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const docRef = doc(db, 'user_profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setRole(docSnap.data().role);
    }
  };

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signUp = (email: string, password: string, _fullName: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  const signInWithGoogle = () =>
    signInWithPopup(auth, googleProvider);

  const signOutUser = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut: signOutUser, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
