"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { File, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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

const recordSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length == 1, 'File is required.')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 10MB.`
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      'Only .pdf files are accepted.'
    ),
  category: z.enum(recordCategories),
});

type RecordFormValues = z.infer<typeof recordSchema>;

// --- TypeScript Type for Firestore Document ---
export interface MedicalRecord {
  id: string;
  patientId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Timestamp;
  category: typeof recordCategories[number];
}

// --- Helper Function to Format Bytes ---
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function MedicalRecords() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<MedicalRecord[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of file being deleted
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      category: 'Prescription',
    },
  });

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchRecords = async () => {
      if (!user) {
        setIsFetching(false);
        return;
      }
      try {
        const recordsCol = collection(db, 'medical_records');
        const q = query(
          recordsCol,
          where('patientId', '==', user.uid),
          orderBy('uploadedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as MedicalRecord)
        );
        setUploadedFiles(records);
      } catch (error) {
        console.error('Error fetching medical records:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch medical records.',
          variant: 'destructive',
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchRecords();
  }, [user, toast]);

  // --- File Upload and Firestore Write ---
  const onSubmit = async (data: RecordFormValues) => {
    // if (!user) {
    //   toast({
    //     title: 'Authentication Error',
    //     description: 'You must be logged in to upload files.',
    //     variant: 'destructive',
    //   });
    //   return;
    // }

    const file = data.file[0] as File;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload to Firebase Storage
      const uniqueFileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(
        storage,
        `medical_records/${user.uid}/${uniqueFileName}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          throw error; // Rethrow to be caught by the outer catch block
        }
      );

      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      // 2. Save Metadata to Firestore
      const recordData = {
        patientId: user.uid,
        fileName: file.name, // Store original file name
        fileUrl: downloadURL,
        fileType: file.type,
        fileSize: file.size,
        category: data.category,
        uploadedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'medical_records'), recordData);

      // 3. Update Local State
      const newRecord: MedicalRecord = {
        id: docRef.id,
        ...recordData,
        uploadedAt: Timestamp.now(), // Approximate for immediate UI update
      };
      setUploadedFiles((prev) => [newRecord, ...prev]);

      toast({
        title: 'Upload Successful',
        description: `${file.name} has been added to your records.`,
      });
      form.reset();
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'An error occurred while uploading your file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
    // --- File Deletion ---
  const handleDelete = async (record: MedicalRecord) => {
    if (!user) return;
    setIsDeleting(record.id);

    try {
      // 1. Delete from Firebase Storage
      const uniqueFileName = record.fileUrl.split('%2F').pop()?.split('?')[0] || record.fileName;
      const storageRef = ref(storage, `medical_records/${user.uid}/${uniqueFileName}`);
      await deleteObject(storageRef);

      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'medical_records', record.id));

      // 3. Update Local State
      setUploadedFiles((prev) => prev.filter((file) => file.id !== record.id));

      toast({
        title: 'Record Deleted',
        description: `${record.fileName} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Could not delete the record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Upload Medical Record</CardTitle>
          <CardDescription>
            Upload a PDF (max 10MB) of your medical history or recent test
            results.
          </CardDescription>
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
                        disabled={isUploading}
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
                      disabled={isUploading}
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
                <Progress value={uploadProgress} className="w-full" />
              )}

              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Upload Record
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Uploaded Files</CardTitle>
          <CardDescription>Your complete medical record history.</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : uploadedFiles.length > 0 ? (
            <ul className="space-y-2">
              {uploadedFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center overflow-hidden">
                    <File className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-medium truncate" title={file.fileName}>{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.fileSize)} |{' '}
                        {file.uploadedAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center flex-shrink-0 ml-2'>
                    <Badge variant="secondary" className='hidden sm:inline-block'>{file.category}</Badge>
                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isDeleting === file.id}>
                           {isDeleting === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete "{file.fileName}" from storage and your records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(file)}>
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
            <p className="text-sm text-center text-muted-foreground py-8">
              No files uploaded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
