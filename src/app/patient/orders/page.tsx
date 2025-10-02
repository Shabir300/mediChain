
"use client";
import { MyOrders } from "@/components/patient/my-orders";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function PharmacyOrdersPage() {
    return (
        <DashboardLayout requiredRole="patient">
             <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Pharmacy Orders</h1>
            </div>
            <MyOrders />
        </DashboardLayout>
    );
}
