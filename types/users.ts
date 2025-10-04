export interface UserAccount {
  uid: string;
  name: string;
  email: string;
  role?: "root" | "admin" | "member" | "caang";
  createdAt: Date;
}