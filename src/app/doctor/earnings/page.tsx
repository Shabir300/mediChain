"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { EarningsChart } from "@/components/doctor/earnings-chart";

export default function DoctorEarningsPage() {
    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Earnings</h1>
            </div>
            <EarningsChart />
        </DashboardLayout>
    );
}
