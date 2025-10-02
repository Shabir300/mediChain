
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { EarningsChart } from "@/components/doctor/earnings-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDataStore } from "@/hooks/use-data-store";
import { DollarSign, Stethoscope, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DoctorEarningsPage() {
    const { appointments } = useDataStore();
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const totalEarnings = completedAppointments.reduce((acc, apt) => acc + apt.cost, 0);
    const totalAppointments = completedAppointments.length;
    const averagePerAppointment = totalAppointments > 0 ? totalEarnings / totalAppointments : 0;
    const recentTransactions = completedAppointments.slice(0, 5);

    return (
        <DashboardLayout requiredRole="doctor">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Earnings</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {totalEarnings.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">From completed appointments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Appointments</CardTitle>
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAppointments}</div>
                        <p className="text-xs text-muted-foreground">Total consultations held</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Per Appointment</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {averagePerAppointment.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Average revenue per session</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Recent Transactions</CardTitle>
                            <CardDescription>Your 5 most recent completed appointments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount (PKR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.map(apt => (
                                        <TableRow key={apt.id}>
                                            <TableCell className="font-medium">{apt.patientName}</TableCell>
                                            <TableCell>{apt.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={apt.type === 'Urgent' ? 'destructive' : 'secondary'}>{apt.type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{apt.cost.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {recentTransactions.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No completed appointments yet.</p>
                             )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <EarningsChart />
                </div>
            </div>
        </DashboardLayout>
    );
}
