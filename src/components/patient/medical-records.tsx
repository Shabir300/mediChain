
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
import { File, Upload, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import type { MedicalRecord } from '@/lib/types';

const recordSchema = z.object({
  file: z.any()
    .refine((files) => files?.length == 1, 'File is required.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Only PDF files are allowed.'),
});

type RecordFormValues = z.infer<typeof recordSchema>;

export function MedicalRecords() {
    const { toast } = useToast();
    const { user } = useAuth();
    const firestore = useFirestore();
    
    const recordsCollectionRef = firestore && user ? collection(firestore, `patients/${user.uid}/records`) : null;
    const { data: medicalRecords, loading } = useCollection<MedicalRecord>(recordsCollectionRef);
    
    const form = useForm<RecordFormValues>({
        resolver: zodResolver(recordSchema),
    });

    const onSubmit = async (data: RecordFormValues) => {
        if (!recordsCollectionRef || !user) return;

        const fileName = data.file[0].name;
        // In a real app, you would upload the file to Firebase Storage and get a URL.
        // For now, we'll just store the name.
        try {
            await addDoc(recordsCollectionRef, {
                patientId: user?.uid,
                fileName: fileName,
                uploadDate: new Date().toISOString().split('T')[0],
                type: 'Prescription', // Default type for demo
                fileUrl: 'https://example.com/placeholder.pdf' // Placeholder URL
            });

            toast({
                title: 'File Uploaded',
                description: `${fileName} has been added to your medical records.`,
            });
            form.reset();
        } catch (error) {
            console.error("Error uploading record: ", error);
             toast({
                variant: "destructive",
                title: 'Upload Failed',
                description: `Could not upload ${fileName}.`,
            });
        }
    };

    const handleDelete = async (recordId: string) => {
        if (!firestore || !user) return;
        
        try {
            await deleteDoc(doc(firestore, `patients/${user.uid}/records`, recordId));
            toast({
                variant: "destructive",
                title: 'Record Deleted',
                description: `The medical record has been successfully removed.`,
            });
        } catch (error) {
            console.error("Error deleting record: ", error);
             toast({
                variant: "destructive",
                title: 'Delete Failed',
                description: `Could not delete the record.`,
            });
        }
    }

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
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                 Upload Record
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
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : medicalRecords && medicalRecords.length > 0 ? (
                        <ul className="space-y-2">
                            {medicalRecords.map((file) => (
                                <li key={file.id} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md">
                                    <div className='flex items-center gap-3'>
                                        <File className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className='font-medium'>{file.fileName}</p>
                                            <p className='text-xs text-muted-foreground'>Uploaded: {file.uploadDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{file.type}</Badge>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the medical record file.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(file.id)}>
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
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
