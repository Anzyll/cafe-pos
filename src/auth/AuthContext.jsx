import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                // Fetch user role from Firestore
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser(currentUser);
                        setRole(userData.role);
                    } else {
                        // RECOVERY: If specific admin email, force create the doc
                        if (currentUser.email === 'admin@badal.com') {
                            console.warn("RECOVERY: Creating missing Admin doc for", currentUser.email);
                            const { setDoc } = await import('firebase/firestore');
                            await setDoc(doc(db, "users", currentUser.uid), {
                                email: currentUser.email,
                                role: 'admin',
                                name: 'Recovery Admin',
                                createdAt: new Date()
                            });
                            setUser(currentUser);
                            setRole('admin');
                        } else {
                            console.error("User authenticated but no user document found");
                            setUser(currentUser);
                            setRole(null);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUser(null);
                    setRole(null);
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        role,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
