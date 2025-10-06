"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { OrderManagement } from "@/components/pharmacy/order-management";

export default function OrdersPage() {
    return (
        <DashboardLayout requiredRole="pharmacy">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Medicine Orders</h1>
            </div>
            <OrderManagement />
        </DashboardLayout>
    );
}