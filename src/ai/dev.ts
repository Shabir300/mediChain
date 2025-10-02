import { config } from 'dotenv';
config();

import '@/ai/flows/doctor-ai-summary.ts';
import '@/ai/flows/ai-symptom-checker.ts';
import '@/ai/flows/low-stock-alerts.ts';
import '@/ai/flows/patient-stock-alert.ts';
