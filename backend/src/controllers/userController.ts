import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = (req: Request, res: Response): void => {
    const users = this.userService.getAllUsers();
    res.json(users);
  };

  createUser = (req: Request, res: Response): void => {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const newUser = this.userService.createUser(name, email);
    res.status(201).json(newUser);
  };

  getUserById = (req: Request, res: Response): void => {
    const user = this.userService.getUserById(parseInt(req.params.id));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  };

  updateUser = (req: Request, res: Response): void => {
    const { name, email } = req.body;
    const updatedUser = this.userService.updateUser(
      parseInt(req.params.id),
      name,
      email
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(updatedUser);
  };

  deleteUser = (req: Request, res: Response): void => {
    const success = this.userService.deleteUser(parseInt(req.params.id));
    if (!success) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).send();
  };
} 