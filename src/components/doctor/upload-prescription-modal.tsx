import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Appointment } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, FileCheck2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/config/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface UploadPrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
}

const consultationSchema = z.object({
    diagnosis: z.string().min(1, "Diagnosis is required"),
    treatment: z.string().optional(),
    instructions: z.string().optional(),
});

export const UploadPrescriptionModal = ({ isOpen, onClose, appointment }: UploadPrescriptionModalProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<z.infer<typeof consultationSchema>>({
        resolver: zodResolver(consultationSchema),
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            const file = event.target.files[0];
            if (file.type !== 'application/pdf') {
                toast({ variant: "destructive", title: "Invalid File", description: "Only PDF files are allowed." });
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB
                toast({ variant: "destructive", title: "File Too Large", description: "File size must be less than 10MB." });
                return;
            }
            setSelectedFile(file);
        }
    };

    const uploadPrescription = async (file: File) => {
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const doctorNameClean = user!.name.replace(/\s/g, '');
        const fileName = `prescription_${doctorNameClean}_${timestamp}.pdf`;
        const storageRef = ref(storage, `medical_records/${appointment.patientId}/${fileName}`);
        
        return new Promise<{ downloadURL: string; fileName: string }>((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on('state_changed',
                (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                (error) => reject(error),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({ downloadURL, fileName });
                }
            );
        });
    };

    const onSubmit = async (data: z.infer<typeof consultationSchema>, withPrescription: boolean) => {
        setIsUploading(true);

        try {
            if (withPrescription && selectedFile) {
                const { downloadURL, fileName } = await uploadPrescription(selectedFile);
                await addDoc(collection(db, 'medical_records'), {
                    patientId: appointment.patientId,
                    fileName,
                    downloadURL,
                    uploadedAt: serverTimestamp(),
                    uploadedBy: 'doctor',
                    doctorId: user!.uid,
                    doctorName: user!.name,
                    category: 'prescription',
                    appointmentId: appointment.id,
                });
            }

            await updateDoc(doc(db, 'appointments', appointment.id!), {
                status: 'completed',
                consultationNotes: data,
                prescriptionUploaded: withPrescription,
            });

            toast({ title: "Consultation Complete", description: "The appointment has been marked as complete." });
            onClose();

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to complete consultation." });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Complete Consultation</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Patient: {appointment.fullName}</p>
                <Form {...form}>
                    <form className="space-y-4">
                        <FormField control={form.control} name="diagnosis" render={({ field }) => (<FormItem><FormLabel>Diagnosis</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="treatment" render={({ field }) => (<FormItem><FormLabel>Treatment</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="instructions" render={({ field }) => (<FormItem><FormLabel>Instructions</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />

                        <div>
                            <FormLabel>Upload Prescription (Optional)</FormLabel>
                            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                                <div className="text-center">
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-300" />
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="application/pdf" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-600">PDF up to 10MB</p>
                                </div>
                            </div>
                            {selectedFile && (
                                <div className="mt-2 text-sm text-green-600 flex items-center">
                                    <FileCheck2 className="h-4 w-4 mr-1" />
                                    {selectedFile.name}
                                </div>
                            )}
                            {isUploading && <progress value={uploadProgress} max="100" className="w-full mt-2" />}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onSubmit(form.getValues(), false)} disabled={isUploading}>
                                Complete Without Prescription
                            </Button>
                            <Button onClick={() => onSubmit(form.getValues(), true)} disabled={!selectedFile || isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload & Complete
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};