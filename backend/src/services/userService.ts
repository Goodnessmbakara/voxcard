import { User, users } from '../models/User';

export class UserService {
  getAllUsers(): User[] {
    return users;
  }

  createUser(name: string, email: string): User {
    const newUser: User = {
      id: users.length + 1,
      name,
      email,
      createdAt: new Date(),
    };
    users.push(newUser);
    return newUser;
  }

  getUserById(id: number): User | undefined {
    return users.find(u => u.id === id);
  }

  updateUser(id: number, name: string, email: string): User | undefined {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;

    users[userIndex] = { ...users[userIndex], name, email };
    return users[userIndex];
  }

  deleteUser(id: number): boolean {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    users.splice(userIndex, 1);
    return true;
  }
} 