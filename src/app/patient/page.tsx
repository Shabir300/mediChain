"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DoctorSearch } from "@/components/patient/doctor-search";
import { MedicalRecords } from "@/components/patient/medical-records";
import { MyOrders } from "@/components/patient/my-orders";
import { SymptomChecker } from "@/components/patient/symptom-checker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, MessageCircle, Search, ShoppingCart } from "lucide-react";

export default function PatientPage() {
    return (
        <DashboardLayout requiredRole="patient">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="font-headline text-3xl md:text-4xl">Patient Dashboard</h1>
            </div>
            <Tabs defaultValue="doctors" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="doctors"><Search className="mr-2 h-4 w-4"/> Find a Doctor</TabsTrigger>
                    <TabsTrigger value="symptoms"><MessageCircle className="mr-2 h-4 w-4"/> AI Symptom Checker</TabsTrigger>
                    <TabsTrigger value="records"><ClipboardList className="mr-2 h-4 w-4"/> Medical Records</TabsTrigger>
                    <TabsTrigger value="orders"><ShoppingCart className="mr-2 h-4 w-4"/> Pharmacy Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="doctors" className="space-y-4">
                    <DoctorSearch />
                </TabsContent>
                <TabsContent value="symptoms" className="space-y-4">
                    <SymptomChecker />
                </TabsContent>
                <TabsContent value="records" className="space-y-4">
                    <MedicalRecords />
                </TabsContent>
                <TabsContent value="orders" className="space-y-4">
                    <MyOrders />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
