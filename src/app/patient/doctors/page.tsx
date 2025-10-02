
"use client";
import { DoctorSearch } from "@/components/patient/doctor-search";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function DoctorSearchPage() {
    return (
        <DashboardLayout requiredRole="patient">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Find a Doctor</h1>
            </div>
            <DoctorSearch />
        </DashboardLayout>
    );
}
