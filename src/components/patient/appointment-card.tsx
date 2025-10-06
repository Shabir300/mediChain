import { Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, MapPin, DollarSign, Calendar, AlertTriangle, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  

interface AppointmentCardProps {
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

export const AppointmentCard = ({ appointment }: AppointmentCardProps) => {
    const { doctorName, doctorSpecialization, date, timeSlot, location, consultationFee, appointmentType, status, notes } = appointment;
    const isUpcoming = date >= new Date() && status !== 'cancelled' && status !== 'completed';

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(date, 'eeee, MMMM dd, yyyy')} • {timeSlot}
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {isUpcoming && <DropdownMenuItem>Cancel</DropdownMenuItem>}
                        {isUpcoming && <DropdownMenuItem>Reschedule</DropdownMenuItem>}
                        {!isUpcoming && <DropdownMenuItem>Book Again</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${doctorName}`} />
                        <AvatarFallback>{doctorName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-bold">{doctorName}</h4>
                        <p className="text-sm text-muted-foreground">{doctorSpecialization}</p>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> 
                        {location?.address ? location.address : "Location not available"}
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> 
                        {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(consultationFee).replace('PKR', 'Rs.')}
                        <span className="mx-1">•</span>
                        {appointmentType === 'urgent' ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4" />}
                        <span className="capitalize">{appointmentType} Appointment</span>
                    </div>
                    <div>{getStatusBadge(status)}</div>
                    {notes && <p className="text-xs text-muted-foreground pt-1"><strong>Notes:</strong> {notes}</p>}
                </div>
            </CardContent>
            {isUpcoming && (
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Reschedule</Button>
                    <Button variant="secondary">View Details</Button>
                </CardFooter>
            )}
        </Card>
    );
};