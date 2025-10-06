import { useState } from 'react';
import { Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Phone, Mail, AlertTriangle, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { PatientDetailsModal } from './patient-details-modal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { UploadPrescriptionModal } from './upload-prescription-modal';

interface DoctorAppointmentCardProps {
    appointment: Appointment;
}

const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
        case 'pending': return <Badge variant="warning"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
        case 'confirmed': return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Confirmed</Badge>;
        case 'completed': return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
        case 'cancelled': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Cancelled</Badge>;
        default: return <Badge variant="secondary">Unknown</Badge>;
    }
};

export const DoctorAppointmentCard = ({ appointment }: DoctorAppointmentCardProps) => {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { toast } = useToast();

    const handleConfirm = async () => {
        const appointmentRef = doc(db, "appointments", appointment.id!);
        await updateDoc(appointmentRef, { status: "confirmed" });
        toast({ title: "Appointment Confirmed", description: "The patient has been notified." });
    };

    const handleDecline = async () => {
        const appointmentRef = doc(db, "appointments", appointment.id!);
        await updateDoc(appointmentRef, { status: "cancelled" });
        toast({ title: "Appointment Declined", description: "The patient has been notified." });
    };

    return (
        <>
        <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {appointment.timeSlot}
                </CardTitle>
                {getStatusBadge(appointment.status)}
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                         <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment.fullName}`} />
                        <AvatarFallback>{appointment.fullName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-bold">{appointment.fullName}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.gender}, {appointment.age} years</p>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {appointment.phone}</div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {appointment.email}</div>
                    <p className="text-xs text-muted-foreground pt-1"><strong>Complaint:</strong> {appointment.notes}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(true)}>View Details</Button>
                {appointment.status === 'pending' && <Button onClick={handleConfirm}>Confirm</Button>}
                {appointment.status === 'pending' && <Button variant="destructive" onClick={handleDecline}>Decline</Button>}
                {appointment.status === 'confirmed' && <Button onClick={() => setIsUploadModalOpen(true)}>Complete Consultation</Button>}
            </CardFooter>
        </Card>

        <PatientDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            appointment={appointment}
        />

        <UploadPrescriptionModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            appointment={appointment}
        />
        </>
    );
};