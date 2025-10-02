
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PatientAppointmentsCalendar } from "@/components/patient/patient-appointments-calendar";

export default function PatientAppointmentsPage() {
    return (
        <DashboardLayout requiredRole="patient">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">My Appointments</h1>
            </div>
            <PatientAppointmentsCalendar />
        </DashboardLayout>
    );
}
