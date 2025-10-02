
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { appointments, orders } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, Stethoscope } from "lucide-react";

export default function BudgetPage() {
    const totalDoctorSpending = appointments.reduce((sum, apt) => sum + apt.cost, 0);
    const totalPharmacySpending = orders.filter(o => o.status === 'approved').reduce((sum, order) => sum + order.total, 0);
    const totalSpending = totalDoctorSpending + totalPharmacySpending;

    return (
        <DashboardLayout requiredRole="patient">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Budget & Spending</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {totalSpending.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Doctors & Pharmacy combined</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doctor Appointments</CardTitle>
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {totalDoctorSpending.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Total spent on consultations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pharmacy Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {totalPharmacySpending.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Total spent on medication</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Appointment History</CardTitle>
                    <CardDescription>A detailed list of all your past and upcoming appointments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Cost (PKR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.map(apt => (
                                <TableRow key={apt.id}>
                                    <TableCell className="font-medium">{apt.doctorName}</TableCell>
                                    <TableCell>{apt.date}</TableCell>
                                    <TableCell>{apt.time}</TableCell>
                                    <TableCell>
                                        <Badge variant={apt.type === 'Urgent' ? 'destructive' : 'secondary'}>{apt.type}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant={apt.status === 'completed' ? 'default' : 'outline'} className="capitalize">{apt.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{apt.cost.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
