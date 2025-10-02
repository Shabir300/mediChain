
"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { InventoryManagement } from "@/components/pharmacy/inventory-management";
import { OrderList } from "@/components/pharmacy/order-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart } from "lucide-react";

export default function PharmacyPage() {
    return (
        <DashboardLayout requiredRole="pharmacy">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Pharmacy Dashboard</h1>
            </div>
            <Tabs defaultValue="orders" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="orders"><ShoppingCart className="mr-2 h-4 w-4" /> Incoming Orders</TabsTrigger>
                    <TabsTrigger value="inventory"><Package className="mr-2 h-4 w-4" /> Inventory Management</TabsTrigger>
                </TabsList>
                <TabsContent value="orders">
                    <OrderList />
                </TabsContent>
                <TabsContent value="inventory">
                    <InventoryManagement />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
