"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { DoctorAppointmentsList } from "@/components/doctor/doctor-appointments-list";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DoctorAppointmentsPage() {
    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">My Appointments</h1>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by patient..."
                        className="pl-8 sm:w-[300px]"
                    />
                </div>
            </div>
            <DoctorAppointmentsList />
        </DashboardLayout>
    );
}