
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MeetingsCalendar } from "@/components/doctor/meetings-calendar";

export default function DoctorMeetingsPage() {
    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Meetings</h1>
            </div>
            <MeetingsCalendar />
        </DashboardLayout>
    );
}
