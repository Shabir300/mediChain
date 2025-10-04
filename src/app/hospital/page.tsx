"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { HospitalDashboard } from "@/components/hospital/hospital-dashboard";

export default function HospitalPage() {
    return (
        <DashboardLayout requiredRole="hospital">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Hospital Dashboard</h1>
            </div>
            <HospitalDashboard />
        </DashboardLayout>
    );
}