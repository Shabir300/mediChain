
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { File, Upload } from 'lucide-react';
import { useDataStore } from '@/hooks/use-data-store';
import { Badge } from '@/components/ui/badge';

const recordSchema = z.object({
  file: z.any()
    .refine((files) => files?.length == 1, 'File is required.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Only PDF files are allowed.'),
});

type RecordFormValues = z.infer<typeof recordSchema>;

export function MedicalRecords() {
    const { toast } = useToast();
    const { medicalRecords, addMedicalRecord } = useDataStore();
    
    const form = useForm<RecordFormValues>({
        resolver: zodResolver(recordSchema),
    });

    const onSubmit = (data: RecordFormValues) => {
        const fileName = data.file[0].name;
        addMedicalRecord({
            fileName: fileName,
            uploadDate: new Date().toISOString().split('T')[0],
            type: 'Prescription' // Default type for demo
        });
        toast({
            title: 'File Uploaded',
            description: `${fileName} has been added to your medical records.`,
        });
        form.reset();
    };

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Upload Record</CardTitle>
                    <CardDescription>Upload a PDF of your medical history or results.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="file"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PDF File</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="file" 
                                                accept=".pdf" 
                                                onChange={(e) => field.onChange(e.target.files)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">
                                <Upload className="mr-2 h-4 w-4" /> Upload Record
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Uploaded Files</CardTitle>
                </CardHeader>
                <CardContent>
                    {medicalRecords.length > 0 ? (
                        <ul className="space-y-2">
                            {medicalRecords.map((file) => (
                                <li key={file.id} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md">
                                    <div className='flex items-center'>
                                        <File className="h-4 w-4 mr-3 text-muted-foreground" />
                                        <div>
                                            <p className='font-medium'>{file.fileName}</p>
                                            <p className='text-xs text-muted-foreground'>Uploaded: {file.uploadDate}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{file.type}</Badge>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-8">No files uploaded yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
