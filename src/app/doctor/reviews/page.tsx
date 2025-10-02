
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Reviews } from "@/components/doctor/reviews";

export default function DoctorReviewsPage() {
    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Patient Reviews</h1>
            </div>
            <Reviews />
        </DashboardLayout>
    );
}
