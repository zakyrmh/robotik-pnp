import { auth } from "@/lib/firebaseConfig";
import {
  User,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  Unsubscribe,
} from "firebase/auth";

export const VerificationService = {
  /**
   * Subscribe to authentication state changes
   * @param callback Function to call when auth state changes
   * @returns Unsubscribe function
   */
  subscribeToAuthChanges: (
    callback: (user: User | null) => void
  ): Unsubscribe => {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Reload current user and check if email is verified
   * @returns Promise<boolean> True if verified, false otherwise
   */
  checkEmailVerified: async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error("Error checking verification status:", error);
      throw error;
    }
  },

  /**
   * Resend verification email to current user
   */
  resendVerificationEmail: async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    return sendEmailVerification(user);
  },

  /**
   * Sign out current user
   */
  logout: async (): Promise<void> => {
    return signOut(auth);
  },
};
