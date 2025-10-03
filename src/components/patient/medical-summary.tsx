
"use client";

import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import { getMedicalSummary, MedicalSummaryOutput } from "@/ai/flows/generate-medical-summary";
import { useHydratedMedicationStore } from "@/hooks/use-medication-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, HeartPulse, Pilcrow, Download } from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useCollection, useFirestore } from "@/firebase";
import { collection, query } from 'firebase/firestore';
import type { Appointment, MedicalRecord } from '@/lib/types';

export function MedicalSummary() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { medications } = useHydratedMedicationStore();
    
    const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(firestore && user ? query(collection(firestore, 'patients', user.uid, 'appointments')) : null);
    const { data: medicalRecords, loading: recordsLoading } = useCollection<MedicalRecord>(firestore && user ? query(collection(firestore, 'patients', user.uid, 'records')) : null);

    const [summary, setSummary] = useState<MedicalSummaryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const summaryRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        if (appointmentsLoading || recordsLoading) return;

        const generateSummary = async () => {
            setIsLoading(true);
            setError(null);
            
            const recordsText = medicalRecords?.map(r => `${r.type} (${r.uploadDate}): ${r.fileName}`).join('\n') || "No records available.";
            const appointmentsText = appointments?.map(a => `${a.date} with ${a.doctorName} (${a.type})`).join('\n') || "No appointments scheduled.";
            const medicationsText = medications.map(m => `${m.name} at ${m.time}`).join('\n') || "No medications prescribed.";

            try {
                const result = await getMedicalSummary({
                    records: recordsText,
                    appointments: appointmentsText,
                    medications: medicationsText
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
    }, [medications, appointments, medicalRecords, appointmentsLoading, recordsLoading]);

    const handleDownloadPdf = () => {
        if (!summary) return;

        setIsDownloading(true);
        toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });
        
        try {
            const doc = new jsPDF();
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.text("AI Medical Summary", 105, 20, { align: "center" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: "center" });

            let yPos = 45;

            // Highlights
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Key Highlights", 14, yPos);
            yPos += 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            const highlightsText = doc.splitTextToSize(`- ${summary.highlights}`, 180);
            doc.text(highlightsText, 14, yPos);
            yPos += highlightsText.length * 5 + 10;
            
            doc.line(14, yPos, 196, yPos); // separator
            yPos += 10;

            // Recent Activity
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Recent Activity", 14, yPos);
            yPos += 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            const activityText = doc.splitTextToSize(summary.recentActivity, 180);
            doc.text(activityText, 14, yPos);
            yPos += activityText.length * 5 + 10;
            
            doc.line(14, yPos, 196, yPos); // separator
            yPos += 10;
            
            // Active Medications
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Active Medications", 14, yPos);
            yPos += 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            const medicationText = doc.splitTextToSize(summary.medicationSummary, 180);
            doc.text(medicationText, 14, yPos);

            doc.save('medical-summary.pdf');

            toast({ title: 'Download Complete!', description: 'Your medical summary PDF has been saved.' });
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate PDF.' });
        } finally {
            setIsDownloading(false);
        }
    }

    const showLoading = isLoading || appointmentsLoading || recordsLoading;

    if (showLoading) {
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
        <Card ref={summaryRef}>
            <CardHeader>
                 <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">AI Medical Summary</CardTitle>
                        <CardDescription>A consolidated overview of your health records, appointments, and medications.</CardDescription>
                    </div>
                    <Button onClick={handleDownloadPdf} disabled={isDownloading} size="sm">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4"/>}
                        Download PDF
                    </Button>
                </div>
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
