"use client";
import { appointments, pharmacyProducts } from "@/lib/data";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pill } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PatientPage() {

    const recentAppointments = appointments.slice(0, 2);
    const currentMedications = pharmacyProducts.filter(p => p.id === 'prod-1' || p.id === 'prod-4');

    return (
        <DashboardLayout requiredRole="patient">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Welcome, Patient</h1>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="font-headline flex items-center gap-2"><Calendar className="h-6 w-6" /> Recent Appointments</CardTitle>
                            <CardDescription>Your upcoming and recent visits.</CardDescription>
                        </div>
                        <Link href="/patient/doctors">
                            <Button variant="outline" size="sm">View All</Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentAppointments.map(apt => (
                            <Card key={apt.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className='flex items-center gap-4'>
                                        <div className='text-center p-2 rounded-md bg-muted'>
                                            <div className='text-sm text-muted-foreground'>
                                                {new Date(apt.date).toLocaleString('default', { month: 'short' })}
                                            </div>
                                            <div className='text-xl font-bold'>
                                                {new Date(apt.date).getDate()}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{apt.doctorName}</p>
                                            <p className="text-sm text-muted-foreground">{apt.time}</p>
                                        </div>
                                    </div>
                                    <Badge variant={apt.type === 'Urgent' ? 'destructive' : 'secondary'}>{apt.type}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="font-headline flex items-center gap-2"><Pill className="h-6 w-6" /> Current Medications</CardTitle>
                            <CardDescription>Your active prescriptions.</CardDescription>
                        </div>
                         <Link href="/patient/orders">
                            <Button variant="outline" size="sm">Order More</Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {currentMedications.map(med => (
                            <div key={med.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-semibold">{med.name}</p>
                                    <p className="text-sm text-muted-foreground">{med.description}</p>
                                </div>
                                <Badge variant="secondary">{med.stock > 0 ? 'In Stock' : 'Out of Stock'}</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
