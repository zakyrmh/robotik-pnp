export interface UserAccount {
  _id: string;
  name: string;
  email: string;
  role?: "root" | "admin" | "member" | "caang";
  createdAt: Date;
}