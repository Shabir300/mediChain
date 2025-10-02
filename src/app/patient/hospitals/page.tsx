"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FindHospitals } from "@/components/patient/find-hospitals";

export default function HospitalsPage() {
    return (
        <DashboardLayout requiredRole="patient">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Find Nearby Hospitals</h1>
            </div>
            <FindHospitals />
        </DashboardLayout>
    );
}
