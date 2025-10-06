import { useState, useEffect } from 'react';
import { Appointment } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { storage } from '@/config/firebase';

interface PatientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
}

interface MedicalRecord {
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    fileSize: number;
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

async function fetchPatientMedicalRecords(patientId: string) {
    const recordsRef = ref(storage, `medical_records/${patientId}`);
    try {
      const result = await listAll(recordsRef);
      const recordsPromises = result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          fileName: itemRef.name,
          fileUrl: url,
          uploadedAt: new Date(metadata.timeCreated).toLocaleDateString(),
          fileSize: metadata.size,
        };
      });
      return await Promise.all(recordsPromises);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return [];
    }
}

export const PatientDetailsModal = ({ isOpen, onClose, appointment }: PatientDetailsModalProps) => {
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoadingRecords(true);
            fetchPatientMedicalRecords(appointment.patientId)
                .then(records => {
                    setMedicalRecords(records);
                    setLoadingRecords(false);
                });
        }
    }, [isOpen, appointment.patientId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Patient Details</DialogTitle>
                    <DialogClose asChild><Button variant="ghost" size="icon" className="rounded-full"><X className="h-4 w-4" /></Button></DialogClose>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    <div className="md:col-span-1 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-2">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment.fullName}`} />
                            <AvatarFallback>{appointment.fullName?.[0]}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold">{appointment.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.gender}, {appointment.age} years</p>
                    </div>
                    <div className="md:col-span-2 space-y-2 text-sm">
                        <p><strong>Email:</strong> {appointment.email}</p>
                        <p><strong>Phone:</strong> {appointment.phone}</p>
                        <p><strong>Appointment Time:</strong> {appointment.timeSlot}</p>
                        <p><strong>Complaint:</strong> {appointment.notes}</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-lg mb-2">Medical Records</h4>
                    {loadingRecords ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : medicalRecords.length > 0 ? (
                        <div className="space-y-2">
                            {medicalRecords.map(record => (
                                <div key={record.fileName} className="flex items-center justify-between p-2 border rounded-md">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        <div>
                                            <p className="font-semibold">{record.fileName}</p>
                                            <p className="text-xs text-muted-foreground">Uploaded: {record.uploadedAt} • Size: {formatFileSize(record.fileSize)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => window.open(record.fileUrl, '_blank')}>View</Button>
                                        <a href={record.fileUrl} download={record.fileName}>
                                            <Button size="sm"><Download className="h-4 w-4 mr-1" /> Download</Button>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No medical records uploaded yet.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};