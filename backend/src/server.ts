import app from './app.js';
import { initializeDatabase } from './db.js';
import { scheduleDailyPolicyStatusUpdate } from './services/policyStatusJob.js';
import { config } from './config.js';

initializeDatabase();
scheduleDailyPolicyStatusUpdate();

app.listen(config.port, () => {
  console.log(`Agentemotor backend iniciado en http://localhost:${config.port}`);
});
