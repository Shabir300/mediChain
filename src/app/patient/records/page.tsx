
"use client";
import { MedicalRecords } from "@/components/patient/medical-records";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MedicalRecordsPage() {
    const { toast } = useToast();

    const handleShare = () => {
        // In a real app, this would generate a secure link or a PDF.
        toast({
            title: "Summary Ready to Share",
            description: "A shareable link to your medical summary has been copied to your clipboard. (Demo)",
        })
    }

    return (
        <DashboardLayout requiredRole="patient">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Medical Records</h1>
                <Button onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4"/>
                    Share Summary
                </Button>
            </div>
            <MedicalRecords />
        </DashboardLayout>
    );
}
