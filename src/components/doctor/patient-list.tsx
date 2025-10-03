
"use client";
import { useMemo } from 'react';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import type { Appointment, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Loader2 } from 'lucide-react';
import { collection, collectionGroup, query, where } from 'firebase/firestore';

interface PatientListItem {
    id: string;
    name: string;
    lastVisit: string;
    avatar?: string;
}

export function PatientList() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const appointmentsQuery = firestore && user ? query(collectionGroup(firestore, 'appointments'), where('doctorId', '==', user.uid)) : null;
    const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

    const patientIds = useMemo(() => {
        if (!appointments) return [];
        return [...new Set(appointments.map(apt => apt.patientId))];
    }, [appointments]);

    const usersQuery = firestore && patientIds.length > 0 ? query(collection(firestore, 'users'), where('uid', 'in', patientIds)) : null;
    const { data: patientsData, loading: patientsLoading } = useCollection<User>(usersQuery);

    const patientsList: PatientListItem[] = useMemo(() => {
        if (!patientsData || !appointments) return [];
        
        return patientsData.map(patient => {
            const patientAppointments = appointments.filter(apt => apt.patientId === patient.uid);
            const lastVisit = patientAppointments.reduce((latest, apt) => {
                return new Date(apt.date) > new Date(latest) ? apt.date : latest;
            }, "1970-01-01");

            return {
                id: patient.uid,
                name: patient.displayName,
                lastVisit: lastVisit,
                // avatarUrl can be added to User entity if needed
            };
        });
    }, [patientsData, appointments]);


    const handleViewHistory = (patientName: string) => {
        toast({
            title: `Loading Medical History`,
            description: `Fetching records for ${patientName}... (Demo)`,
        });
    };
    
    const isLoading = appointmentsLoading || patientsLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Patient Overview</CardTitle>
                <CardDescription>A list of your recent patients.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Last Visit</TableHead>
                                <TableHead className='text-right'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patientsList.map(patient => (
                                <TableRow key={patient.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                {patient.avatar && <AvatarImage src={patient.avatar} alt={patient.name} />}
                                                <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className='font-medium'>{patient.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{patient.lastVisit}</TableCell>
                                    <TableCell className='text-right'>
                                        <Button variant="outline" size="sm" onClick={() => handleViewHistory(patient.name)}>
                                            View History
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 { !isLoading && patientsList.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">No patients found.</p>
                )}
            </CardContent>
        </Card>
    );
}

    