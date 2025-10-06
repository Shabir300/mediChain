"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  UploadCloud,
  X,
  Trash2,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { storage, db } from '@/config/firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';

// --- Zod Schema for Form Validation ---
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];
const recordCategories = [
  'Prescription',
  'Lab Report',
  'X-Ray/Scan',
  'Medical History',
  'Other',
] as const;

const uploadRecordSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length === 1, 'File is required.')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 10MB.`
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      'Only .pdf files are accepted.'
    ),
  category: z.enum(recordCategories, {
    required_error: 'Please select a category.',
  }),
});

// --- Type Definition ---
interface MedicalRecord {
  id: string;
  patientId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: typeof recordCategories[number];
  uploadedAt: Timestamp;
}

// --- Helper Functions ---
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (timestamp: Timestamp) => {
  return timestamp.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// --- Main Component ---
export const MedicalRecords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof uploadRecordSchema>>({
    resolver: zodResolver(uploadRecordSchema),
  });

  // --- Data Fetching ---
  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'medical_records'),
        where('patientId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedRecords = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MedicalRecord[];
      
      fetchedRecords.sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());

      setRecords(fetchedRecords);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch medical records.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // --- File Upload ---
  const onSubmit = async (data: z.infer<typeof uploadRecordSchema>) => {
    if (!user) return;
    const file = data.file[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(
        storage,
        `medical_records/${user.uid}/${Date.now()}_${file.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }
      );

      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      const recordData = {
        patientId: user.uid,
        fileName: file.name,
        fileUrl: downloadURL,
        fileType: file.type,
        fileSize: file.size,
        category: data.category,
        uploadedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'medical_records'), recordData);

      setRecords((prev) => [
        { ...recordData, id: docRef.id, uploadedAt: new Timestamp(Date.now() / 1000, 0) },
        ...prev,
      ]);

      toast({
        title: 'Success',
        description: 'Your medical record has been uploaded.',
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description:
          error.code || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // --- File Deletion ---
  const handleDelete = async (record: MedicalRecord) => {
    if (!user) return;
    try {
      const fileRef = ref(storage, record.fileUrl);
      await deleteObject(fileRef);
  
      await deleteDoc(doc(db, 'medical_records', record.id));
  
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      toast({
        title: 'Record Deleted',
        description: `${record.fileName} has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the record. Please try again.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Medical Records</CardTitle>
            <CardDescription>
              Manage and upload your medical documents securely.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload a New Medical Record</DialogTitle>
                <DialogDescription>
                  Select a PDF file and a category for your document.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document (PDF only, max 10MB)</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => field.onChange(e.target.files)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recordCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isUploading && (
                    <div className="space-y-1">
                      <p className="text-sm">
                        Uploading... {uploadProgress.toFixed(0)}%
                      </p>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Upload
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
               <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
                </div>
               </div>
            ))}
           </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No medical records
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first document.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-semibold">{record.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {record.category} • Uploaded on {formatDate(record.uploadedAt)} •{' '}
                      {formatFileSize(record.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <a
                        href={record.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                        <Eye className="mr-2 h-4 w-4" /> View
                    </a>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(record)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};