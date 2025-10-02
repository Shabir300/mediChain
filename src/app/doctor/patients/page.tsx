
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PatientList } from "@/components/doctor/patient-list";

export default function DoctorPatientsPage() {
    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">My Patients</h1>
            </div>
            <PatientList />
        </DashboardLayout>
    );
}
