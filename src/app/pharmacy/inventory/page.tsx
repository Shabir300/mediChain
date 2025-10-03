
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { InventoryManagement } from "@/components/pharmacy/inventory-management";

export default function PharmacyInventoryPage() {
    return (
        <DashboardLayout requiredRole="pharmacy">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Inventory Management</h1>
            </div>
            <InventoryManagement />
        </DashboardLayout>
    );
}
