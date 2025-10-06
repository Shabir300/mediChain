"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { MedicineInventory } from "@/components/pharmacy/medicine-inventory";

export default function MedicinesPage() {
    return (
        <DashboardLayout requiredRole="pharmacy">
            <MedicineInventory />
        </DashboardLayout>
    );
}