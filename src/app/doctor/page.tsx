
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AppointmentsCalendar } from "@/components/doctor/appointments-calendar";
import { EarningsChart } from "@/components/doctor/earnings-chart";
import { Reviews } from "@/components/doctor/reviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LineChart, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DoctorPage() {
    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Doctor Dashboard</h1>
                <Link href="/doctor/meetings">
                    <Button>View Calendar</Button>
                </Link>
            </div>
            <AppointmentsCalendar />
        </DashboardLayout>
    );
}
