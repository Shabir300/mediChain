
"use client";
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Star, Clock, Stethoscope, GraduationCap, Building, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { useAuth, useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, doc, addDoc, query, where, collectionGroup } from 'firebase/firestore';
import type { Appointment, Doctor } from '@/lib/types';


// Mock time slots for a day
const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM"
];

export default function DoctorProfilePage() {
    const params = useParams();
    const doctorId = params.id as string;
    const { user } = useAuth();
    const firestore = useFirestore();

    const doctorRef = firestore && doctorId ? doc(firestore, "doctors", doctorId) : null;
    const { data: doctor, loading: doctorLoading } = useDoc<Doctor>(doctorRef);

    // This is not ideal, but a workaround for querying appointments for a specific doctor across all patients
    const appointmentsQuery = firestore && doctorId ? query(collectionGroup(firestore, 'appointments'), where('doctorId', '==', doctorId)) : null;
    const { data: appointments } = useCollection<Appointment>(appointmentsQuery);

    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const { toast } = useToast();
    
    if (doctorLoading) {
        return (
            <DashboardLayout requiredRole='patient'>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="ml-2">Loading Doctor Profile...</p>
                </div>
            </DashboardLayout>
        )
    }

    if (!doctor) {
        notFound();
    }
    
    const handleBookAppointment = async () => {
        if (!doctor || !selectedDate || !selectedTime || !user || !firestore) {
             toast({
                variant: 'destructive',
                title: 'Booking Failed',
                description: 'Please select a date and time.',
            });
            return;
        }

        try {
            await addDoc(collection(firestore, `patients/${user.uid}/appointments`), {
                patientId: user.uid,
                patientName: user.displayName,
                doctorName: doctor.fullName,
                doctorId: doctor.uid,
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: selectedTime,
                type: isUrgent ? 'Urgent' : 'Normal',
                status: 'booked',
                cost: isUrgent ? 3000 : 1500,
            });

            toast({
                title: 'Appointment Booked!',
                description: `Your ${isUrgent ? 'urgent' : 'normal'} appointment with ${doctor.fullName} on ${format(selectedDate, 'PPP')} at ${selectedTime} has been confirmed.`,
            });

            setIsBookingOpen(false);
            setIsUrgent(false);
            setSelectedDate(new Date());
            setSelectedTime(null);
        } catch (error) {
            console.error("Error booking appointment: ", error);
             toast({
                variant: 'destructive',
                title: 'Booking Error',
                description: 'Could not book the appointment. Please try again.',
            });
        }
    }

    const bookedSlotsForDay = useMemo(() => {
        if (!appointments || !selectedDate) return [];
        return appointments
            .filter(apt => format(new Date(apt.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
            .map(apt => apt.time);
    }, [selectedDate, appointments]);

    const handleCloseDialog = () => {
        setIsBookingOpen(false);
        setSelectedDate(new Date());
        setSelectedTime(null);
        setIsUrgent(false);
    }

    return (
        <DashboardLayout requiredRole="patient">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className='lg:col-span-1'>
                    <Card className="overflow-hidden">
                        {doctor.avatar ? (
                            <Image
                                src={doctor.avatar}
                                alt={`Portrait of ${doctor.fullName}`}
                                width={400}
                                height={400}
                                className="w-full h-80 object-cover"
                            />
                        ) : (
                            <div className="w-full h-80 bg-muted flex items-center justify-center">
                                <Stethoscope className="w-16 h-16 text-muted-foreground"/>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl font-headline">{doctor.fullName}</CardTitle>
                            <CardDescription className='flex items-center gap-2'><Stethoscope className='h-4 w-4'/>{doctor.specialty}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button className="w-full" onClick={() => setIsBookingOpen(true)}>
                                <Clock className='mr-2 h-4 w-4' /> Book Appointment
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className='lg:col-span-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='font-headline'>Doctor's Bio</CardTitle>
                            <CardDescription>Learn more about {doctor.fullName}'s background and expertise.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-sm">
                           <p className="text-muted-foreground">{doctor.bio}</p>
                           <div className="flex items-center">
                                <GraduationCap className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Education</p>
                                    <p>{doctor.education}</p>
                                </div>
                           </div>
                           <div className="flex items-center">
                                <Building className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Clinic</p>
                                    <p>{doctor.clinicName}</p>
                                </div>
                           </div>
                           <div className="flex items-center">
                                <MapPin className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Address</p>
                                    <p>{doctor.address}</p>
                                </div>
                           </div>
                           <div className="flex items-center">
                                <Briefcase className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Previous Experience</p>
                                    <p>{doctor.previousExperience}</p>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className='font-headline'>Book Appointment with {doctor?.fullName}</DialogTitle>
                        <DialogDescription>
                            Select a date and an available time slot.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div>
                             <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                className="rounded-md border"
                            />
                             <div className="flex items-center space-x-2 mt-4">
                                <Switch id="urgent-toggle" checked={isUrgent} onCheckedChange={setIsUrgent} />
                                <Label htmlFor="urgent-toggle" className={isUrgent ? 'font-bold text-destructive' : ''}>
                                    Mark as Urgent
                                </Label>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Available Slots for {selectedDate ? format(selectedDate, 'PPP') : '...'}</h4>
                            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-2">
                                {timeSlots.map(slot => {
                                    const isBooked = bookedSlotsForDay.includes(slot);
                                    return (
                                        <Button 
                                            key={slot} 
                                            variant={selectedTime === slot ? 'default' : 'outline'}
                                            disabled={isBooked}
                                            onClick={() => setSelectedTime(slot)}
                                        >
                                            {slot}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleBookAppointment} disabled={!selectedTime}>Confirm Booking</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

    