
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PharmacyPage() {
    return (
        <DashboardLayout requiredRole="pharmacy">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Pharmacy Dashboard</h1>
            </div>
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Welcome!</CardTitle>
                    <CardDescription>Select an option from the sidebar to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>You can manage incoming orders or view your inventory from the links in the sidebar.</p>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
