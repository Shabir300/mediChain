
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Clock, Loader2, Stethoscope } from 'lucide-react';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, collectionGroup, where } from 'firebase/firestore';
import type { Doctor, Appointment } from '@/lib/types';
import Image from 'next/image';

type FilterType = 'all' | 'nearby' | 'in-city';

export function DoctorSearch() {
  const firestore = useFirestore();
  const { data: doctors, loading: doctorsLoading } = useCollection<Doctor>(firestore ? query(collection(firestore, 'doctors')) : null);
  
  // This is not ideal, but a workaround for querying appointments across all patients
  const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(firestore ? query(collectionGroup(firestore, 'appointments')) : null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState('');

  const convertTo24Hour = (time12h: string) => {
    if (!time12h) return null;
    const [time, modifier] = time12h.split(' ');
    if (!time || !modifier) return null;
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier.toUpperCase() === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const filteredDoctors = doctors?.filter(
    (doctor) => {
        const matchesSearch = doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        
        if (timeFilter && appointments) {
            const isDoctorBusy = appointments.some(apt => {
                 const appointmentTime24h = convertTo24Hour(apt.time);
                 return apt.doctorId === doctor.uid && appointmentTime24h === timeFilter;
            });
            if (isDoctorBusy) return false;
        }

        return true;
    }
  );
  
  const isLoading = doctorsLoading || appointmentsLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Find Your Doctor</CardTitle>
          <CardDescription>Search for available doctors and view their profiles.</CardDescription>
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
          {isLoading ? (
            <div className='flex justify-center items-center h-48'>
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors?.map((doctor) => {
                    return (
                        <Link href={`/patient/doctors/${doctor.uid}`} key={doctor.uid} className="block h-full transition-all hover:shadow-lg hover:-translate-y-1">
                            <Card className="overflow-hidden h-full">
                                <CardHeader className="p-0">
                                     {doctor.avatar ? (
                                        <Image src={doctor.avatar} alt={doctor.fullName} width={400} height={300} className="w-full h-48 object-cover" />
                                    ) : (
                                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                                            <Stethoscope className="w-16 h-16 text-muted-foreground"/>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-4">
                                        <div className='flex justify-between items-start'>
                                        <CardTitle className="text-xl font-headline">{doctor.fullName}</CardTitle>
                                    </div>
                                    <CardDescription className='mt-1'>{doctor.specialty}</CardDescription>
                                        <div className='flex gap-2 mt-2'>
                                        <Label className='text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full'>{doctor.location}</Label>
                                        {doctor.availability === 'Online' && (
                                            <Label className='text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full'>Online</Label>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
                {filteredDoctors?.length === 0 && (
                    <div className="col-span-full text-center py-10">
                        <p className="text-muted-foreground">No doctors match your criteria.</p>
                    </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

    