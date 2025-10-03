
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Clock, PlusCircle, Trash2 } from 'lucide-react';
import { useHydratedMedicationStore, Medication } from '@/hooks/use-medication-store';

const reminderSchema = z.object({
  name: z.string().min(2, 'Medication name is required.'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM).'),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

export function MedicationManager() {
    const { toast } = useToast();
    const { medications, addMedication, removeMedication } = useHydratedMedicationStore();
    
    const form = useForm<ReminderFormValues>({
        resolver: zodResolver(reminderSchema),
        defaultValues: {
            name: '',
            time: '',
        }
    });

    const onSubmit = (data: ReminderFormValues) => {
        const newMed: Medication = {
            id: `med-${Date.now()}`,
            name: data.name,
            time: data.time,
        };
        addMedication(newMed);
        toast({
            title: 'Reminder Set',
            description: `You will be reminded to take ${data.name} at ${data.time}.`,
        });
        form.reset();
    };

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Add New Reminder</CardTitle>
                    <CardDescription>Set a time to be notified to take your medicine.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Medication Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Paracetamol" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time (24-hour format)</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Reminder
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline">Your Reminders</CardTitle>
                    <CardDescription>The list of medications you need to take.</CardDescription>
                </CardHeader>
                <CardContent>
                    {medications.length > 0 ? (
                        <ul className="space-y-3">
                            {medications.map((med) => (
                                <li key={med.id} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md">
                                    <div className='flex items-center'>
                                        <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                                        <div>
                                            <p className='font-medium'>{med.name}</p>
                                            <p className='text-xs font-bold text-primary'>{med.time}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMedication(med.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-8">No medication reminders set yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
