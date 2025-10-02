
"use client";
import { useState } from 'react';
import Image from 'next/image';
import { useDataStore } from '@/hooks/use-data-store';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function PatientList() {
    const { patients } = useDataStore();
    const { toast } = useToast();

    const handleViewHistory = (patientName: string) => {
        toast({
            title: `Loading Medical History`,
            description: `Fetching records for ${patientName}... (Demo)`,
        });
    };
    
    const getImage = (id: string) => {
        return PlaceHolderImages.find(img => img.id === id);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Patient Overview</CardTitle>
                <CardDescription>A list of your recent patients.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {patients.map(patient => {
                            const image = getImage(patient.avatar);
                            return (
                                <TableRow key={patient.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                {image && <AvatarImage src={image.imageUrl} alt={image.description} />}
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
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
