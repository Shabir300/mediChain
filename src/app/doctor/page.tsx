
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AppointmentsCalendar } from "@/components/doctor/appointments-calendar";
import { EarningsChart } from "@/components/doctor/earnings-chart";
import { Reviews } from "@/components/doctor/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useCollection, useFirestore } from "@/firebase";
import { DollarSign, Users, Star, Loader2 } from "lucide-react";
import type { Appointment, Review } from "@/lib/types";
import { collection, query, where, collectionGroup } from "firebase/firestore";

export default function DoctorPage() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const appointmentsQuery = firestore && user ? query(collectionGroup(firestore, 'appointments'), where('doctorId', '==', user.uid)) : null;
    const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

    const reviewsQuery = firestore && user ? query(collection(firestore, `doctors/${user.uid}/reviews`)) : null;
    const { data: reviews, loading: reviewsLoading } = useCollection<Review>(reviewsQuery);
    
    const totalEarnings = appointments?.filter(a => a.status === 'completed').reduce((acc, apt) => acc + apt.cost, 0) || 0;
    
    const uniquePatients = appointments ? [...new Set(appointments.map(a => a.patientId))] : [];
    const totalPatients = uniquePatients.length;

    const averageRating = reviews && reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0;

    const isLoading = appointmentsLoading || reviewsLoading;

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="doctor">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="ml-2">Loading Dashboard...</p>
                </div>
            </DashboardLayout>
        );
    }

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
                        <p className="text-xs text-muted-foreground">From all completed appointments</p>
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
                        <p className="text-xs text-muted-foreground">From {reviews?.length || 0} reviews</p>
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
