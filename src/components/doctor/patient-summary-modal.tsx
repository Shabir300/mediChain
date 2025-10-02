"use client";

import { useEffect, useState } from 'react';
import { getPatientSummary, PatientSummaryInput } from '@/ai/flows/doctor-ai-summary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Appointment } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface PatientSummaryModalProps {
    appointment: Appointment;
    isOpen: boolean;
    onClose: () => void;
}

export function PatientSummaryModal({ appointment, isOpen, onClose }: PatientSummaryModalProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchSummary = async () => {
                setIsLoading(true);
                setError(null);
                setSummary(null);

                // This simulates fetching real-time data for the specific patient.
                // In a real app, you would fetch this from a database based on appointment.patientId
                const patientData: PatientSummaryInput = {
                    patientHistory: "Patient has a history of mild asthma and seasonal allergies. No surgeries. Non-smoker.",
                    lastVisitDate: "2024-01-15",
                    condition: `Patient is coming in for a ${appointment.type.toLowerCase()} visit regarding a recent complaint.`,
                    currentMedicine: "Albuterol inhaler as needed for asthma."
                };

                try {
                    const result = await getPatientSummary(patientData);
                    setSummary(result.summary);
                } catch (err) {
                    console.error("Error fetching AI summary:", err);
                    setError("Failed to generate AI summary. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSummary();
        }
    }, [isOpen, appointment]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='font-headline'>AI Pre-Consultation Briefing: {appointment.patientName}</DialogTitle>
                    <DialogDescription>
                        This is an AI-generated summary to prepare you for your upcoming appointment.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading && (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Generating briefing...</p>
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {summary && (
                        <div className="text-sm space-y-2 p-4 bg-muted/50 rounded-lg">
                            <p>{summary}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
