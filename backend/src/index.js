import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';

import authRoutes from './routes/auth.js';
import onboardingRoutes from './routes/onboarding.js';
import metaRoutes from './routes/meta.js';
import studentRoutes from './routes/student.js';
import facultyRoutes from './routes/faculty.js';
import recruiterRoutes from './routes/recruiter.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aptivelle-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/recruiter', recruiterRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({
      message: first ? first.message : 'Invalid input.',
      field: first?.path?.[0],
    });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('[api error]', err);
  }
  return res.status(status).json({
    message: err.message || 'Something went wrong on the server.',
  });
});

const port = Number(process.env.API_PORT) || 4000;
app.listen(port, () => {
  console.log(`Aptivelle API running → http://localhost:${port}`);
});
