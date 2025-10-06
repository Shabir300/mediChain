"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Appointment } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentCard } from './appointment-card';
import { Skeleton } from '@/components/ui/skeleton';

export const AppointmentsList = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const q = query(
            collection(db, 'appointments')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAppointments = snapshot.docs.map(doc => {
                const data = doc.data();
                // Check if the date field exists and is a Firestore Timestamp
                if (data.date && typeof data.date.toDate === 'function') {
                    return {
                        id: doc.id,
                        ...data,
                        date: data.date.toDate(),
                    } as Appointment;
                } else {
                    console.warn(`Appointment document ${doc.id} is missing a valid date field.`);
                    return null;
                }
            }).filter(Boolean) as Appointment[]; // filter(Boolean) removes null entries
            
            const userAppointments = fetchedAppointments.filter(apt => apt.patientId === user.uid);
            
            setAppointments(userAppointments);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appointments: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (activeTab === 'upcoming') {
            return appointments
                .filter(apt => apt.date >= today && apt.status !== 'cancelled' && apt.status !== 'completed')
                .sort((a, b) => a.date.getTime() - b.date.getTime());
        }
        if (activeTab === 'previous') {
            return appointments
                .filter(apt => apt.date < today || apt.status === 'cancelled' || apt.status === 'completed')
                .sort((a, b) => b.date.getTime() - a.date.getTime());
        }
        return appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [appointments, activeTab]);

    return (
        <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="previous">Previous</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
                <p className="text-sm text-muted-foreground my-4">
                    Showing {filteredAppointments.length} {activeTab} appointments.
                </p>
                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
                    ) : (
                        filteredAppointments.map(appointment => (
                            <AppointmentCard key={appointment.id} appointment={appointment} />
                        ))
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
};