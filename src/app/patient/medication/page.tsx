
"use client";
import { MedicationManager } from "@/components/patient/medication-manager";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function MedicationPage() {
    return (
        <DashboardLayout requiredRole="patient">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Medication Reminders</h1>
            </div>
            <MedicationManager />
        </DashboardLayout>
    );
}
