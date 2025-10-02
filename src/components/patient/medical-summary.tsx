"use client";

import { useEffect, useState } from "react";
import { getMedicalSummary, MedicalSummaryOutput } from "@/ai/flows/generate-medical-summary";
import { appointments, medicalRecords } from "@/lib/data";
import { useMedicationStore } from "@/hooks/use-medication-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, HeartPulse, Pilcrow, Calendar } from "lucide-react";
import { Separator } from "../ui/separator";

export function MedicalSummary() {
    const { medications } = useMedicationStore();
    const [summary, setSummary] = useState<MedicalSummaryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const generateSummary = async () => {
            setIsLoading(true);
            setError(null);
            
            // Format all the data for the AI prompt
            const recordsText = medicalRecords.map(r => `${r.type} (${r.uploadDate}): ${r.fileName}`).join('\n');
            const appointmentsText = appointments.map(a => `${a.date} with ${a.doctorName} (${a.type})`).join('\n');
            const medicationsText = medications.map(m => `${m.name} at ${m.time}`).join('\n');

            try {
                const result = await getMedicalSummary({
                    records: recordsText || "No records available.",
                    appointments: appointmentsText || "No appointments scheduled.",
                    medications: medicationsText || "No medications prescribed."
                });
                setSummary(result);
            } catch (err) {
                console.error("AI Medical Summary Error:", err);
                setError("Failed to generate the AI medical summary.");
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();
    }, [medications]);


    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">AI Medical Summary</CardTitle>
                    <CardDescription>Your consolidated health overview.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Generating your summary...</p>
                </CardContent>
            </Card>
        )
    }

    if (error) {
         return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">AI Medical Summary</CardTitle>
                <CardDescription>A consolidated overview of your health records, appointments, and medications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold flex items-center mb-2"><HeartPulse className="mr-2 h-5 w-5 text-primary"/> Key Highlights</h3>
                    <p className="text-sm text-muted-foreground italic">"{summary?.highlights}"</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold flex items-center mb-2"><Calendar className="mr-2 h-5 w-5 text-primary"/> Recent Activity</h3>
                        <p className="text-sm text-muted-foreground">{summary?.recentActivity}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center mb-2"><Pilcrow className="mr-2 h-5 w-5 text-primary"/> Active Medications</h3>
                        <p className="text-sm text-muted-foreground">{summary?.medicationSummary}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
