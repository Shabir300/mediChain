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

const recordSchema = z.object({
  file: z.any()
    .refine((files) => files?.length == 1, 'File is required.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Only PDF files are allowed.'),
});

type RecordFormValues = z.infer<typeof recordSchema>;

export function MedicalRecords() {
    const { toast } = useToast();
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    
    const form = useForm<RecordFormValues>({
        resolver: zodResolver(recordSchema),
    });

    const onSubmit = (data: RecordFormValues) => {
        // In a real app, this would upload to Firebase Storage.
        // For the demo, we just add the filename to a list and show a toast.
        const fileName = data.file[0].name;
        setUploadedFiles(prev => [...prev, fileName]);
        toast({
            title: 'File Uploaded',
            description: `${fileName} has been added to your medical records.`,
        });
        form.reset();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Upload Medical Record</CardTitle>
                <CardDescription>Upload a PDF of your medical history or recent test results.</CardDescription>
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
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Uploaded Files</h3>
                    {uploadedFiles.length > 0 ? (
                        <ul className="space-y-2">
                            {uploadedFiles.map((file, index) => (
                                <li key={index} className="flex items-center text-sm p-2 bg-muted/50 rounded-md">
                                    <File className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {file}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
