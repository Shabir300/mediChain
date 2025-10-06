import { User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, GraduationCap, Briefcase, Clock, X } from "lucide-react";
import { GoogleMap, Marker } from "@react-google-maps/api";

interface DoctorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor: User;
    onBookAppointment: () => void;
}

export const DoctorProfileModal = ({ isOpen, onClose, doctor, onBookAppointment }: DoctorProfileModalProps) => {
    if (!isOpen) return null;

    const { name, doctorData } = doctor;
    const { specialization, bio, qualification, experience, hospitalAffiliation, consultationFee, profileImage, location, ratings, reviews } = doctorData!;

    const formattedFee = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(consultationFee || 0).replace('PKR', 'Rs.');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader className="flex-row items-center gap-4">
                    <Avatar className="h-28 w-28 border-2 border-primary">
                        <AvatarImage src={profileImage} alt={name} />
                        <AvatarFallback>{name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <DialogTitle className="text-3xl font-bold">{name}</DialogTitle>
                        <p className="text-muted-foreground">{specialization}</p>
                        {ratings && ratings.count > 0 && (
                            <div className="flex items-center gap-1.5 pt-1">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-lg">{ratings.average.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">({ratings.count} reviews)</span>
                            </div>
                        )}
                    </div>
                    <DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                  </DialogClose>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-lg mb-2">About</h4>
                            <p className="text-muted-foreground text-sm">{bio || "No bio available."}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Education & Experience</h4>
                            <p className="text-muted-foreground text-sm"><strong>Qualification:</strong> {qualification}</p>
                            <p className="text-muted-foreground text-sm"><strong>Experience:</strong> {experience} years</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><Clock className="w-5 h-5" /> Available Timings</h4>
                            <ul className="text-muted-foreground text-sm list-disc list-inside">
                                <li>Monday - Friday: 12:00 PM - 7:00 PM</li>
                                <li>Saturday: 12:00 PM - 3:00 PM</li>
                                <li>Sunday: Closed</li>
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Practice Location</h4>
                            <p className="text-muted-foreground text-sm"><strong>Clinic:</strong> {hospitalAffiliation}</p>
                            <p className="text-muted-foreground text-sm"><strong>Address:</strong> {location?.address}</p>
                            {location?.lat && location?.lng && (
                                <div className="h-48 w-full rounded-md overflow-hidden mt-2">
                                    <GoogleMap mapContainerStyle={{ height: '100%', width: '100%' }} center={location} zoom={15}>
                                        <Marker position={location} />
                                    </GoogleMap>
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mb-2">Consultation Fee</h4>
                            <p className="text-muted-foreground text-sm">{formattedFee} per consultation</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><Star className="w-5 h-5" /> Reviews</h4>
                    {reviews && reviews.length > 0 ? (
                        <div className="space-y-4 max-h-48 overflow-y-auto">
                            {reviews.map(review => (
                                <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{review.patientName}</p>
                                        <div className="flex items-center gap-1">
                                            {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
                                            {[...Array(5 - review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-gray-300" />)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                                    <p className="text-xs text-muted-foreground text-right mt-2">{new Date(review.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
                    )}
                </div>

                <DialogFooter className="pt-6">
                    <Button size="lg" className="w-full md:w-auto" onClick={onBookAppointment}>📅 Book Appointment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};