"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { OrderHistory } from "@/components/patient/order-history";

export default function OrderHistoryPage() {
    return (
        <DashboardLayout requiredRole="patient">
            <OrderHistory />
        </DashboardLayout>
    );
}