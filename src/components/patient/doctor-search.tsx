"use client";

import { useState } from 'react';
import Image from 'next/image';
import { doctors, Doctor } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
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

export function DoctorSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const { toast } = useToast();

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getImage = (id: string) => {
    return PlaceHolderImages.find(img => img.id === id);
  }

  const handleBookAppointment = () => {
    if (!selectedDoctor) return;
    // In a real app, this would save to a database.
    // For the demo, we just show a toast.
    toast({
        title: 'Appointment Booked!',
        description: `Your ${isUrgent ? 'urgent' : 'normal'} appointment with ${selectedDoctor.name} has been confirmed.`,
    });
    setSelectedDoctor(null);
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
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                        </CardContent>
                        <CardFooter className="p-4">
                            <Button className="w-full" onClick={() => setSelectedDoctor(doctor)}>Book Appointment</Button>
                        </CardFooter>
                    </Card>
                )
            })}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className='font-headline'>Book Appointment with {selectedDoctor?.name}</DialogTitle>
                <DialogDescription>
                    Select appointment type. For the demo, we'll assume the next available slot.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <div className="flex items-center space-x-2">
                    <Switch id="urgent-toggle" checked={isUrgent} onCheckedChange={setIsUrgent} />
                    <Label htmlFor="urgent-toggle" className={isUrgent ? 'font-bold text-destructive' : ''}>
                        {isUrgent ? 'Urgent Appointment' : 'Normal Appointment'}
                    </Label>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedDoctor(null)}>Cancel</Button>
                <Button onClick={handleBookAppointment}>Confirm Booking</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
