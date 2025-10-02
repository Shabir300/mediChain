
"use client";

import { useState, useMemo } from 'react';
import { appointments, Appointment } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';

type View = 'all' | 'urgent' | 'normal';

export function MeetingsCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [view, setView] = useState<View>('all');

    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            if (view === 'all') return true;
            return apt.type.toLowerCase() === view;
        });
    }, [view]);
    
    const appointmentsByDate = useMemo(() => {
        const grouped: { [key: string]: Appointment[] } = {};
        filteredAppointments.forEach(apt => {
            const day = format(new Date(apt.date), 'yyyy-MM-dd');
            if (!grouped[day]) {
                grouped[day] = [];
            }
            grouped[day].push(apt);
        });
        return grouped;
    }, [filteredAppointments]);

    const DayCell = ({ date }: { date: Date }) => {
        const dayStr = format(date, 'yyyy-MM-dd');
        const dayAppointments = appointmentsByDate[dayStr];

        return (
            <div className='relative h-full w-full p-1'>
                <time dateTime={dayStr}>{format(date, 'd')}</time>
                {dayAppointments && (
                    <div className='mt-1 space-y-0.5'>
                        {dayAppointments.slice(0, 2).map(apt => (
                            <div key={apt.id} className={`w-full rounded-sm px-1 text-xs ${apt.type === 'Urgent' ? 'bg-destructive/80 text-destructive-foreground' : 'bg-secondary'}`}>
                                {apt.patientName.split(' ')[0]}
                            </div>
                        ))}
                         {dayAppointments.length > 2 && (
                            <div className='text-xs text-muted-foreground'>+ {dayAppointments.length - 2} more</div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    const selectedDayStr = date ? format(date, 'yyyy-MM-dd') : '';
    const selectedDayAppointments = appointmentsByDate[selectedDayStr] || [];

    return (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
                <Card>
                    <CardHeader>
                        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
                            <TabsList>
                                <TabsTrigger value="all">All Meetings</TabsTrigger>
                                <TabsTrigger value="urgent">Urgent Meetings</TabsTrigger>
                                <TabsTrigger value="normal">Normal Meetings</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                         <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="p-0 [&_td]:h-24 [&_td]:align-top"
                            components={{
                                Day: (props) => <DayCell date={props.date} />
                            }}
                         />
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle className='font-headline'>
                           Appointments for {date ? format(date, 'PPP') : '...'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDayAppointments.length > 0 ? (
                             <div className="space-y-4">
                                {selectedDayAppointments.map(apt => (
                                    <Card key={apt.id}>
                                        <CardContent className="p-3">
                                            <p className="font-semibold">{apt.patientName}</p>
                                            <p className="text-sm text-muted-foreground">{apt.time}</p>
                                            <Badge variant={apt.type === 'Urgent' ? 'destructive' : 'secondary'} className='mt-1'>{apt.type}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className='text-sm text-center text-muted-foreground py-8'>No appointments scheduled for this day.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
