import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/auth-context";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, getDay } from 'date-fns';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor: User;
}

const patientDetailsSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender."}),
    age: z.coerce.number().min(1, "Age must be at least 1").max(120, "Age must be at most 120"),
    notes: z.string().optional(),
});

const appointmentSchema = z.object({
    date: z.date({ required_error: "Please select a date."}),
    timeSlot: z.string({ required_error: "Please select a time slot."}),
    appointmentType: z.enum(["normal", "urgent"], { required_error: "Please select an appointment type."}),
});

export const BookingModal = ({ isOpen, onClose, doctor }: BookingModalProps) => {
    const [step, setStep] = useState(1);
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patientData, setPatientData] = useState<z.infer<typeof patientDetailsSchema> | null>(null);
    const [appointmentData, setAppointmentData] = useState<z.infer<typeof appointmentSchema> | null>(null);

    const patientForm = useForm<z.infer<typeof patientDetailsSchema>>({
        resolver: zodResolver(patientDetailsSchema),
        defaultValues: {
            fullName: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
        }
    });

    const appointmentForm = useForm<z.infer<typeof appointmentSchema>>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: { appointmentType: "normal" }
    });

    const onPatientSubmit = (data: z.infer<typeof patientDetailsSchema>) => {
        setPatientData(data);
        setStep(2);
    };

    const onAppointmentSubmit = async (data: z.infer<typeof appointmentSchema>) => {
        setIsSubmitting(true);
        setAppointmentData(data);
        try {
            // Sanitize patient data to prevent undefined fields
            const finalPatientData = {
                ...patientData,
                notes: patientData?.notes || "",
            };

            await addDoc(collection(db, "appointments"), {
                patientId: user!.uid,
                ...finalPatientData,
                doctorId: doctor.uid,
                doctorName: doctor.name,
                doctorSpecialization: doctor.doctorData?.specialization,
                ...data,
                status: "pending",
                createdAt: serverTimestamp(),
                location: doctor.doctorData?.location,
                consultationFee: doctor.doctorData?.consultationFee,
                meetingLink: "",
            });

            await addDoc(collection(db, "notifications"), {
                userId: doctor.uid,
                type: "appointment",
                title: "New Appointment Booked",
                message: `Patient ${patientData?.fullName} booked an appointment for ${data.date.toLocaleDateString()} at ${data.timeSlot}`,
                read: false,
                createdAt: serverTimestamp(),
            });

             await addDoc(collection(db, "notifications"), {
                userId: user!.uid,
                type: "appointment",
                title: "Appointment Confirmed",
                message: `Your appointment with Dr. ${doctor.name} is confirmed for ${data.date.toLocaleDateString()} at ${data.timeSlot}`,
                read: false,
                createdAt: serverTimestamp(),
            });
            
            toast({ title: "Appointment Booked!", description: "Your appointment has been successfully booked.", });
            setStep(3);

        } catch (error) {
            console.error("Booking Error:", error);
            toast({ variant: "destructive", title: "Booking Failed", description: "Could not book your appointment. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateTimeSlots = (date: Date) => {
        const day = getDay(date);
        if (day === 0) return []; // Sunday
        if (day === 6) return ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"]; // Saturday
        return ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"]; // Weekdays
    };

    const selectedDate = appointmentForm.watch("date");
    const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

    const handleClose = () => {
        setStep(1);
        patientForm.reset();
        appointmentForm.reset();
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{step === 3 ? "Appointment Confirmed" : `Book Appointment with ${doctor.name}`}</DialogTitle>
                    {step < 3 && <div className="text-sm text-muted-foreground">
                        Step {step} of 3: {step === 1 ? "Your Information" : "Choose Time"}
                    </div>}
                </DialogHeader>

                {step === 1 && (
                    <Form {...patientForm}>
                    <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-4 pt-4">
                            <FormField control={patientForm.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={patientForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={patientForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={patientForm.control} name="gender" render={({ field }) => (
                                <FormItem className="space-y-3"><FormLabel>Gender *</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="other" /></FormControl><FormLabel className="font-normal">Other</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={patientForm.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={patientForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes / Reason for Visit (Optional)</FormLabel><FormControl><Textarea {...field} placeholder="Describe your symptoms or reason for visit" /></FormControl><FormMessage /></FormItem>)} />
                         <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button type="submit">Next: Select Time →</Button>
                        </DialogFooter>
                    </form>
                    </Form>
                )}

                {step === 2 && (
                    <Form {...appointmentForm}>
                     <form onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={appointmentForm.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col items-center">
                                        <FormLabel>Select Date *</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                selected={field.value}
                                                onChange={(date) => field.onChange(date)}
                                                minDate={addDays(new Date(), 1)}
                                                filterDate={(date) => getDay(date) !== 0} // Disable Sundays
                                                inline
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {selectedDate && (
                                <FormField
                                    control={appointmentForm.control}
                                    name="timeSlot"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Available Time Slots for {selectedDate.toLocaleDateString()} *</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-4 gap-2 pt-2">
                                                        {timeSlots.map(slot => (
                                                            <FormItem key={slot} className="flex items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <RadioGroupItem value={slot} id={slot} className="peer sr-only" />
                                                                </FormControl>
                                                                <FormLabel htmlFor={slot} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                                                    {slot}
                                                                </FormLabel>
                                                            </FormItem>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                             <FormField control={appointmentForm.control} name="appointmentType" render={({ field }) => (
                                <FormItem className="space-y-3"><FormLabel>Appointment Type *</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="normal" /></FormControl><FormLabel className="font-normal">Normal</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="urgent" /></FormControl><FormLabel className="font-normal">Urgent</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                                Confirm Appointment
                            </Button>
                        </DialogFooter>
                    </form>
                    </Form>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Appointment Booked Successfully!</h2>
                        <p className="text-muted-foreground mb-6">A confirmation has been sent to your email.</p>
                        <Card className="w-full text-left">
                            <CardContent className="p-4 space-y-2">
                                <p><strong>Doctor:</strong> {doctor.name}</p>
                                <p><strong>Date:</strong> {appointmentData?.date.toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {appointmentData?.timeSlot}</p>
                                <p><strong>Patient:</strong> {patientData?.fullName}</p>
                            </CardContent>
                        </Card>
                        <DialogFooter className="pt-6">
                            <Button className="w-full" onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};