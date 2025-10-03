
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OrderList } from "@/components/pharmacy/order-list";

export default function PharmacyOrdersPage() {
    return (
        <DashboardLayout requiredRole="pharmacy">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Incoming Orders</h1>
            </div>
            <OrderList />
        </DashboardLayout>
    );
}
