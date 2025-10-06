"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Appointment } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorAppointmentCard } from './doctor-appointment-card';
import { Skeleton } from '@/components/ui/skeleton';

export const DoctorAppointmentsList = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today');

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        // Query without the orderBy clause to prevent index error
        const q = query(
            collection(db, 'appointments'),
            where('doctorId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAppointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate(),
            })) as Appointment[];
            setAppointments(fetchedAppointments);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Client-side sorting is applied here
        if (activeTab === 'today') {
            return appointments
                .filter(apt => apt.date >= today && apt.date < tomorrow)
                .sort((a, b) => a.date.getTime() - b.date.getTime());
        }
        if (activeTab === 'upcoming') {
            return appointments
                .filter(apt => apt.date >= tomorrow)
                .sort((a, b) => a.date.getTime() - b.date.getTime());
        }
        if (activeTab === 'previous') {
            return appointments
                .filter(apt => apt.date < today)
                .sort((a, b) => b.date.getTime() - a.date.getTime());
        }
        return appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [appointments, activeTab]);

    return (
        <Tabs defaultValue="today" onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="previous">Previous</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
                <p className="text-sm text-muted-foreground my-4">
                    Showing {filteredAppointments.length} appointments.
                </p>
                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 w-full" />)
                    ) : (
                        filteredAppointments.map(appointment => (
                            <DoctorAppointmentCard key={appointment.id} appointment={appointment} />
                        ))
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
};