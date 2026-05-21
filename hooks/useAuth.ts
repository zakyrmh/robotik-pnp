import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser, signOut as serverSignOut } from '@/lib/actions/auth';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    photo_url?: string;
    nim?: string;
    is_onboarded?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuth = (): AuthContextType => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Memoize the supabase client instance to keep static reference
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        let isMounted = true;

        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser();
                if (isMounted) {
                    if (userData) {
                        setUser({
                            id: userData.id,
                            email: userData.email || '',
                            name: userData.name,
                            role: userData.role,
                            photo_url: userData.photo_url || undefined,
                            nim: userData.nim || undefined,
                            is_onboarded: userData.is_onboarded,
                        });
                    } else {
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch user');
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUser();
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) {
                throw signInError;
            }
            // Fetch updated user after successful login
            const userData = await getCurrentUser();
            if (userData) {
                setUser({
                    id: userData.id,
                    email: userData.email || '',
                    name: userData.name,
                    role: userData.role,
                    photo_url: userData.photo_url || undefined,
                    nim: userData.nim || undefined,
                    is_onboarded: userData.is_onboarded,
                });
            } else {
                setUser(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login error');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            await serverSignOut();
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return { user, loading, error, login, logout };
};