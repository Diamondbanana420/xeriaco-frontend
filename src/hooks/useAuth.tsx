import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

interface User {
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    session: null;
    loading: boolean;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading] = useState(false);

    const signUp = async (email: string, _password: string, fullName?: string) => {
        setUser({ email, name: fullName });
        toast.success("Account created successfully");
        return { error: null };
    };

    const signIn = async (email: string, _password: string) => {
        setUser({ email });
        toast.success("Signed in successfully");
        return { error: null };
    };

    const signOut = async () => {
        setUser(null);
        toast.success("Signed out successfully");
    };

    return (
        <AuthContext.Provider value={{ user, session: null, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
