"use client";
import { MedicalRecords } from "@/components/patient/medical-records";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function MedicalRecordsPage() {
    return (
        <DashboardLayout requiredRole="patient">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Medical Records</h1>
            </div>
            <MedicalRecords />
        </DashboardLayout>
    );
}
