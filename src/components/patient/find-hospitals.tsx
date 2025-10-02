"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Hospital {
    id: string;
    name: string;
    address: string;
    distance: string;
}

const mockHospitals: Hospital[] = [
    { id: 'h1', name: 'City General Hospital', address: '123 Health St, Medville', distance: '1.2 km' },
    { id: 'h2', name: 'St. Luke\'s Medical Center', address: '456 Care Ave, Medville', distance: '2.5 km' },
    { id: 'h3', name: 'Community Health Clinic', address: '789 Wellness Blvd, Medville', distance: '3.1 km' },
];

export function FindHospitals() {
    const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGetLocation = () => {
        setLoading(true);
        setError(null);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lon: longitude });
                    setLoading(false);
                    toast({ description: 'Location found successfully.' });
                },
                (err) => {
                    setError('Unable to retrieve your location. Please grant permission and try again.');
                    setLoading(false);
                    toast({ variant: 'destructive', title: 'Location Error', description: err.message });
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    };
    
    useEffect(() => {
        handleGetLocation();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Nearby Hospitals</CardTitle>
                <CardDescription>Based on your current location. <Button variant="link" size="sm" onClick={handleGetLocation}>Refresh Location</Button></CardDescription>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className='flex flex-col items-center justify-center gap-4 text-center py-16'>
                        <Loader2 className='h-8 w-8 animate-spin text-primary' />
                        <p className='text-muted-foreground'>Getting your location...</p>
                    </div>
                )}
                {error && !loading && (
                    <div className='flex flex-col items-center justify-center gap-4 text-center text-destructive py-16'>
                        <p>{error}</p>
                        <Button onClick={handleGetLocation}>Try Again</Button>
                    </div>
                )}
                {location && !loading && (
                     <div className="grid gap-6 md:grid-cols-2">
                        {/* Simulated Map */}
                        <div className='bg-muted rounded-lg flex items-center justify-center h-96 col-span-full md:col-span-1'>
                           <div className='text-center text-muted-foreground'>
                                <MapPin className='h-12 w-12 mx-auto mb-2' />
                                <p className='font-bold'>Map View</p>
                                <p className='text-xs'>A Google Map would be displayed here.</p>
                           </div>
                        </div>
                        {/* List of hospitals */}
                        <div className='space-y-4 col-span-full md:col-span-1'>
                             {mockHospitals.map(hospital => (
                                <Card key={hospital.id}>
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className='font-bold'>{hospital.name}</p>
                                            <p className='text-sm text-muted-foreground'>{hospital.address}</p>
                                            <p className='text-xs font-semibold text-primary mt-1'>{hospital.distance} away</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => window.open('https://www.google.com/maps', '_blank')}>
                                            <Navigation className='mr-2 h-4 w-4'/>
                                            Directions
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     </div>
                )}
            </CardContent>
        </Card>
    );
}
