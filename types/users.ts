export interface UserData {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: "root" | "admin" | "member" | "caang";
  createdAt: Date;
}