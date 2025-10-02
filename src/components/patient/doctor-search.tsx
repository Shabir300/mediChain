
"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Doctor } from '@/lib/data';
import { useDataStore } from '@/hooks/use-data-store';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

type FilterType = 'all' | 'nearby' | 'in-city';

// Mock time slots for a day
const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM"
];

export function DoctorSearch() {
  const { doctors, appointments, addAppointment } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [timeFilter, setTimeFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { toast } = useToast();

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const filteredDoctors = doctors.filter(
    (doctor) => {
        const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        let matchesLocation = false;
        switch (filter) {
            case 'nearby':
                matchesLocation = doctor.location === 'Nearby';
                break;
            case 'in-city':
                matchesLocation = doctor.location === 'In City';
                break;
            case 'all':
            default:
                matchesLocation = true;
                break;
        }

        if (!matchesLocation) return false;
        
        if (timeFilter) {
            const isDoctorBusy = appointments.some(apt => {
                 const appointmentTime24h = convertTo24Hour(apt.time);
                 return apt.doctorId === doctor.id && appointmentTime24h === timeFilter;
            });
            if (isDoctorBusy) return false;
        }

        return true;
    }
  );
  
  const getImage = (id: string) => {
    return PlaceHolderImages.find(img => img.id === id);
  }

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
         toast({
            variant: 'destructive',
            title: 'Booking Failed',
            description: 'Please select a date and time.',
        });
        return;
    }
    
    addAppointment({
        doctorName: selectedDoctor.name,
        doctorId: selectedDoctor.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        type: isUrgent ? 'Urgent' : 'Normal',
        cost: isUrgent ? 3000 : 1500, // Example cost
    });
    
    toast({
        title: 'Appointment Booked!',
        description: `Your ${isUrgent ? 'urgent' : 'normal'} appointment with ${selectedDoctor.name} on ${format(selectedDate, 'PPP')} at ${selectedTime} has been confirmed.`,
    });

    setSelectedDoctor(null);
    setIsUrgent(false);
    setSelectedDate(new Date());
    setSelectedTime(null);
  }

  const bookedSlotsForDay = useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];
    return appointments
        .filter(apt => apt.doctorId === selectedDoctor.id && format(new Date(apt.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
        .map(apt => apt.time);
  }, [selectedDoctor, selectedDate, appointments]);

  const handleCloseDialog = () => {
    setSelectedDoctor(null);
    setSelectedDate(new Date());
    setSelectedTime(null);
    setIsUrgent(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Find Your Doctor</CardTitle>
          <CardDescription>Search for available doctors and book an appointment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Search by name or specialty..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="time"
                    className="pl-10"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                />
            </div>
             <RadioGroup defaultValue="all" onValueChange={(value: FilterType) => setFilter(value)} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nearby" id="nearby" />
                    <Label htmlFor="nearby">Nearby</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-city" id="in-city" />
                    <Label htmlFor="in-city">In City</Label>
                </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => {
                const image = getImage(doctor.avatar);
                return (
                    <Card key={doctor.id} className="overflow-hidden">
                        <CardHeader className="p-0">
                            {image && (
                                <Image
                                    src={image.imageUrl}
                                    alt={image.description}
                                    data-ai-hint={image.imageHint}
                                    width={400}
                                    height={400}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                        </CardHeader>
                        <CardContent className="p-4">
                            <CardTitle className="text-xl font-headline">{doctor.name}</CardTitle>
                            <CardDescription className='mt-1'>{doctor.specialty}</CardDescription>
                             <div className='flex gap-2 mt-2'>
                                <Label className='text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full'>{doctor.location}</Label>
                                {doctor.availability === 'Online' && (
                                    <Label className='text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full'>Online</Label>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4">
                            <Button className="w-full" onClick={() => setSelectedDoctor(doctor)}>Book Appointment</Button>
                        </CardFooter>
                    </Card>
                )
            })}
             {filteredDoctors.length === 0 && (
                <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">No doctors match your criteria.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedDoctor} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle className='font-headline'>Book Appointment with {selectedDoctor?.name}</DialogTitle>
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
    </>
  );
}
