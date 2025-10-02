"use client";

import { useState } from 'react';
import { appointments, Appointment } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Video, Bot } from 'lucide-react';
import { PatientSummaryModal } from './patient-summary-modal';

export function AppointmentsCalendar() {
    // For the demo, we use static data.
    const [appointmentList] = useState<Appointment[]>(appointments);
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
                    <div className="space-y-4">
                        {appointmentList.map(apt => (
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
                                            <p className="font-semibold">{apt.patientName}</p>
                                            <p className="text-sm text-muted-foreground">{apt.time}</p>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <Badge variant={apt.type === 'Urgent' ? 'destructive' : 'secondary'}>{apt.type}</Badge>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(apt)}>
                                            <Bot className="mr-2 h-4 w-4" /> AI Summary
                                        </Button>
                                        <Button size="sm" onClick={handleStartMeeting}>
                                            <Video className="mr-2 h-4 w-4" /> Start Meeting
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
