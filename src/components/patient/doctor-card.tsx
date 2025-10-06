import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, GraduationCap, Briefcase } from "lucide-react";

interface DoctorCardProps {
    doctor: User;
    onViewDetails: () => void;
    userLocation: { lat: number; lng: number } | null;
}

// Haversine formula to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

export const DoctorCard = ({ doctor, onViewDetails, userLocation }: DoctorCardProps) => {
    const { name, doctorData } = doctor;
    const { specialization, hospitalAffiliation, experience, consultationFee, profileImage, location, ratings } = doctorData!;

    const formattedFee = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(consultationFee || 0).replace('PKR', 'Rs.');

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
            <CardContent className="p-4 flex gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={profileImage} alt={name} />
                    <AvatarFallback>{name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{name}</h3>
                        {ratings && ratings.count > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span>{ratings.average.toFixed(1)}</span>
                                <span className="text-xs">({ratings.count})</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">{specialization}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        <span>{hospitalAffiliation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        <span>{experience} years experience</span>
                    </div>
                    {userLocation && location?.lat && location?.lng && (
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                                {calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng).toFixed(1)} km away
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                        <p className="font-semibold">{formattedFee}</p>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(); }}>
                            View Details
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};