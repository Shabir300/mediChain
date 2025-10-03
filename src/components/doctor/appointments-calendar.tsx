
"use client";

import { useState } from 'react';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Video, Bot, Loader2 } from 'lucide-react';
import { PatientSummaryModal } from './patient-summary-modal';
import { collectionGroup, query, where } from 'firebase/firestore';
import { format } from 'date-fns';

export function AppointmentsCalendar() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const today = format(new Date(), 'yyyy-MM-dd');
    const appointmentsQuery = firestore && user 
        ? query(
            collectionGroup(firestore, 'appointments'), 
            where('doctorId', '==', user.uid),
            where('date', '==', today)
          ) 
        : null;

    const { data: appointments, loading } = useCollection<Appointment>(appointmentsQuery);

    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const handleStartMeeting = () => {
        window.open('https://meet.google.com', '_blank');
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Today's Appointments</CardTitle>
                    <CardDescription>Here are the appointments scheduled for today.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments && appointments.length > 0 ? (
                                appointments.map(apt => (
                                    <Card key={apt.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className='flex items-center gap-4'>
                                                <div className='text-center p-2 rounded-md bg-muted'>
                                                    <div className='text-sm text-muted-foreground'>
                                                        {new Date(apt.date).toLocaleString('default', { month: 'short' })}
                                                    </div>
                                                    <div className='text-xl font-bold'>
                                                        {new Date(apt.date).getDate()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{apt.patientName || `Patient ${apt.patientId.substring(0,5)}`}</p>
                                                    <p className="text-sm text-muted-foreground">{apt.time}</p>
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Badge variant={apt.type === 'Urgent' ? 'destructive' : 'secondary'}>{apt.type}</Badge>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(apt)}>
                                                    <Bot className="mr-2 h-4 w-4" /> AI Briefing
                                                </Button>
                                                <Button size="sm" onClick={handleStartMeeting}>
                                                    <Video className="mr-2 h-4 w-4" /> Start Meeting
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-center py-8 text-muted-foreground">No appointments scheduled for today.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {selectedAppointment && (
                 <PatientSummaryModal 
                    appointment={selectedAppointment} 
                    isOpen={!!selectedAppointment} 
                    onClose={() => setSelectedAppointment(null)} 
                 />
            )}
        </>
    );
}

    