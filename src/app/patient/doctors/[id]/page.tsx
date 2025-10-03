
"use client";
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { useDataStore } from '@/hooks/use-data-store';
import { Doctor } from '@/lib/data';
import { DashboardLayout } from "@/components/dashboard-layout";
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
import { Star, Clock, Stethoscope, GraduationCap, Building, MapPin, Briefcase } from 'lucide-react';

// Mock time slots for a day
const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM"
];

// Mock detailed data, in a real app this would come from the backend
const doctorDetails: any = {
    '1': { education: "MD in Cardiology, Stanford University", clinicName: "HeartCare Center", address: "123 Health St.", city: "Medville", country: "USA", previousExperience: "10 years at General Hospital" },
    '2': { education: "Pediatrics Residency, Johns Hopkins", clinicName: "KidsHealth Clinic", address: "456 Wellness Ave.", city: "Medville", country: "USA", previousExperience: "5 years at City Pediatrics" },
    '3': { education: "Dermatology, Mayo Clinic", clinicName: "The Skin Institute", address: "789 Derma Rd.", city: "Medville", country: "USA", previousExperience: "Lead Dermatologist at Radiant Skin" },
}


export default function DoctorProfilePage() {
    const params = useParams();
    const doctorId = params.id as string;
    const { doctors, appointments, addAppointment } = useDataStore();
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const { toast } = useToast();
    
    const doctor = doctors.find(d => d.id === doctorId);
    const details = doctorDetails[doctorId];

    if (!doctor) {
        notFound();
    }
    
    const image = PlaceHolderImages.find(img => img.id === doctor.avatar);

    const handleBookAppointment = () => {
        if (!doctor || !selectedDate || !selectedTime) {
             toast({
                variant: 'destructive',
                title: 'Booking Failed',
                description: 'Please select a date and time.',
            });
            return;
        }
        
        addAppointment({
            doctorName: doctor.name,
            doctorId: doctor.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: selectedTime,
            type: isUrgent ? 'Urgent' : 'Normal',
            cost: isUrgent ? 3000 : 1500,
        });
        
        toast({
            title: 'Appointment Booked!',
            description: `Your ${isUrgent ? 'urgent' : 'normal'} appointment with ${doctor.name} on ${format(selectedDate, 'PPP')} at ${selectedTime} has been confirmed.`,
        });

        setIsBookingOpen(false);
        setIsUrgent(false);
        setSelectedDate(new Date());
        setSelectedTime(null);
    }

    const bookedSlotsForDay = useMemo(() => {
        if (!doctor || !selectedDate) return [];
        return appointments
            .filter(apt => apt.doctorId === doctor.id && format(new Date(apt.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
            .map(apt => apt.time);
    }, [doctor, selectedDate, appointments]);

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
                        {image && (
                            <Image
                                src={image.imageUrl}
                                alt={image.description}
                                data-ai-hint={image.imageHint}
                                width={400}
                                height={400}
                                className="w-full h-80 object-cover"
                            />
                        )}
                        <CardHeader>
                            <div className='flex justify-between items-start'>
                                <CardTitle className="text-2xl font-headline">{doctor.name}</CardTitle>
                            </div>
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
                            <CardDescription>Learn more about {doctor.name}'s background and expertise.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-sm">
                           <div className="flex items-center">
                                <GraduationCap className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Education</p>
                                    <p>{details.education}</p>
                                </div>
                           </div>
                           <div className="flex items-center">
                                <Building className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Clinic</p>
                                    <p>{details.clinicName}</p>
                                </div>
                           </div>
                           <div className="flex items-center">
                                <MapPin className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Address</p>
                                    <p>{details.address}, {details.city}, {details.country}</p>
                                </div>
                           </div>
                           <div className="flex items-center">
                                <Briefcase className="h-5 w-5 mr-3 text-primary"/>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Previous Experience</p>
                                    <p>{details.previousExperience}</p>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className='font-headline'>Book Appointment with {doctor?.name}</DialogTitle>
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
