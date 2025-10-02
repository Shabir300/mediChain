
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AppointmentsCalendar } from "@/components/doctor/appointments-calendar";
import { EarningsChart } from "@/components/doctor/earnings-chart";
import { Reviews } from "@/components/doctor/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appointments, patients, reviews } from "@/lib/data";
import { DollarSign, Users, Star } from "lucide-react";

export default function DoctorPage() {
    const totalEarnings = appointments.reduce((acc, apt) => acc + apt.cost, 0);
    const totalPatients = patients.length;
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Doctor Dashboard</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {totalEarnings.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">From all appointments</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPatients}</div>
                        <p className="text-xs text-muted-foreground">Under your care</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageRating.toFixed(1)} / 5</div>
                        <p className="text-xs text-muted-foreground">From {reviews.length} reviews</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <AppointmentsCalendar />
                </div>
                <div className="lg:col-span-2 space-y-6">
                   <EarningsChart />
                   <Reviews />
                </div>
            </div>
        </DashboardLayout>
    );
}
