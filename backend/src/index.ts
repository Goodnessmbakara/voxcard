import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PlanController } from './controllers/planController';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize controllers
const planController = new PlanController();

// Routes
app.get('/api/plans', planController.getAllPlans);
app.post('/api/plans', planController.createPlan);
app.get('/api/plans/:id', planController.getPlanById);
app.put('/api/plans/:id', planController.updatePlan);
app.delete('/api/plans/:id', planController.deletePlan);
app.post('/api/plans/:id/join', planController.joinPlan);
app.post('/api/plans/:id/leave', planController.leavePlan);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});