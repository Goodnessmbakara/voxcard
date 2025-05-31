export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// In-memory data store (replace with a database in production)
export let users: User[] = []; 