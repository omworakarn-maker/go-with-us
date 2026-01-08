import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Get all trips
app.get('/trips', async (req, res) => {
  const trips = await prisma.trip.findMany();
  res.json(trips);
});

// Get trip by id
app.get('/trips/:id', async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: Number(req.params.id) } });
  if (!trip) return res.status(404).json({ error: 'Not found' });
  res.json(trip);
});

// Create trip
app.post('/trips', async (req, res) => {
  const trip = await prisma.trip.create({ data: req.body });
  res.status(201).json(trip);
});

// Update trip
app.put('/trips/:id', async (req, res) => {
  const trip = await prisma.trip.update({ where: { id: Number(req.params.id) }, data: req.body });
  res.json(trip);
});

// Delete trip
app.delete('/trips/:id', async (req, res) => {
  await prisma.trip.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
