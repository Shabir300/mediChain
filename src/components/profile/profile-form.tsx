
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { updateUser } from '@/lib/firestore';
import { uploadProfileImage } from '@/lib/storage';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { match } from 'ts-pattern';
import { Autocomplete, GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// Schemas
const baseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  profileImage: z.any().optional(),
});

const patientSchema = baseSchema.extend({
  patientData: z.object({
    dateOfBirth: z.string().optional(),
    bloodGroup: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    emergencyContact: z.string().optional(),
    address: z.string().optional(),
  }),
});

const doctorSchema = baseSchema.extend({
  doctorData: z.object({
    specialization: z.string().optional(),
    experience: z.coerce.number().optional(),
    qualification: z.string().optional(),
    hospitalAffiliation: z.string().optional(),
    consultationFee: z.coerce.number().optional(),
    availableOnline: z.boolean().optional(),
    bio: z.string().optional(),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().min(1, "Address is required"),
    }).optional(),
  }),
});

const pharmacySchema = baseSchema.extend({
  pharmacyData: z.object({
    pharmacyName: z.string().min(1, "Pharmacy name is required"),
    licenseNumber: z.string().min(5, "License number must be at least 5 characters"),
    address: z.string().min(1, "Address is required"),
    operatingHours: z.string().min(1, "Operating hours are required"),
    contactNumber: z.string().min(1, "Contact number is required"),
    profileImage: z.any().optional(),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string(),
    }).optional(),
  }),
});

const hospitalSchema = baseSchema.extend({
  hospitalData: z.object({
    hospitalName: z.string().optional(),
    licenseNumber: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    ambulanceCount: z.coerce.number().optional(),
    facilities: z.array(z.string()).optional(),
    availableBeds: z.coerce.number().optional(),
    operatingHours: z.string().optional(),
    website: z.string().url().optional(),
  }),
});

const getSchema = (role: User['role']) => {
  switch (role) {
    case 'patient': return patientSchema;
    case 'doctor': return doctorSchema;
    case 'pharmacy': return pharmacySchema;
    case 'hospital': return hospitalSchema;
    default: return baseSchema;
  }
};


export function ProfileForm() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(getSchema(user!.role)),
    defaultValues: { ...user },
  });

  useEffect(() => {
    form.reset(user as any);
    const roleData = (user as any)[`${user!.role}Data`];
    if (roleData?.profileImage) {
      setPreviewUrl(roleData.profileImage);
    }
  }, [user, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
        let imageUrl = (user as any)[`${user!.role}Data`]?.profileImage;
      if (profileImageFile) {
        imageUrl = await uploadProfileImage(user!.uid, profileImageFile);
      }
      
      const { profileImage, ...restOfData } = data;
      const roleDataKey = `${user!.role}Data`;
      
      const updatedData = {
          ...user,
          ...restOfData,
          [roleDataKey]: {
              ...(user as any)[roleDataKey],
              ...data[roleDataKey],
              profileImage: imageUrl,
          }
      };

      await updateUser(user!.uid, updatedData);
      setUser(updatedData as User);
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
        libraries={["places"]}
    >
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {user.role !== 'pharmacy' && (
            <Card>
                <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>Upload a picture to personalize your profile.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                    <AvatarImage src={previewUrl || undefined} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Input type="file" onChange={handleFileChange} />
                </CardContent>
            </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input value={user.email} disabled />
            </FormItem>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {match(user)
            .with({ role: 'patient' }, (patient) => (
                <PatientForm form={form} />
            ))
            .with({ role: 'doctor' }, (doctor) => (
                <DoctorForm form={form} />
            ))
            .with({ role: 'pharmacy' }, (pharmacy) => (
                <PharmacyForm form={form} handleFileChange={handleFileChange} previewUrl={previewUrl} />
            ))
            .with({ role: 'hospital' }, (hospital) => (
                <HospitalForm form={form} />
            ))
            .exhaustive()
        }

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Profile
        </Button>
      </form>
    </Form>
    </LoadScript>
  );
}


// Role-specific form components
const PatientForm = ({ form }: { form: any }) => (
  <Card>
    <CardHeader>
      <CardTitle>Patient Details</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">
      <FormField control={form.control} name="patientData.dateOfBirth" render={({ field }) => (<FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="patientData.bloodGroup" render={({ field }) => (<FormItem><FormLabel>Blood Group</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger></FormControl><SelectContent><SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem><SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem><SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem><SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="patientData.allergies" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Allergies (comma-separated)</FormLabel><FormControl><Input {...field} onChange={e => field.onChange(e.target.value.split(','))} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="patientData.emergencyContact" render={({ field }) => (<FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="patientData.address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
    </CardContent>
  </Card>
);

const DoctorForm = ({ form }: { form: any }) => (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Doctor Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField control={form.control} name="doctorData.specialization" render={({ field }) => (<FormItem><FormLabel>Specialization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="doctorData.experience" render={({ field }) => (<FormItem><FormLabel>Experience (years)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="doctorData.qualification" render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="doctorData.hospitalAffiliation" render={({ field }) => (<FormItem><FormLabel>Hospital Affiliation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="doctorData.consultationFee" render={({ field }) => (<FormItem><FormLabel>Consultation Fee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="doctorData.availableOnline" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Available Online</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="doctorData.bio" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
      </CardContent>
    </Card>
    <LocationForm form={form} role="doctor" />
    </>
  );
  
  const PharmacyForm = ({ form, handleFileChange, previewUrl }: { form: any, handleFileChange: any, previewUrl: string | null }) => (
    <>
    <Card>
        <CardHeader><CardTitle>Store Image</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || undefined} />
                <AvatarFallback>Store</AvatarFallback>
            </Avatar>
            <Input type="file" onChange={handleFileChange} />
        </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Pharmacy Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField control={form.control} name="pharmacyData.pharmacyName" render={({ field }) => (<FormItem><FormLabel>Pharmacy Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="pharmacyData.licenseNumber" render={({ field }) => (<FormItem><FormLabel>License Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="pharmacyData.operatingHours" render={({ field }) => (<FormItem><FormLabel>Operating Hours</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="pharmacyData.contactNumber" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      </CardContent>
    </Card>
    <LocationForm form={form} role="pharmacy" />
    </>
  );
  
  const HospitalForm = ({ form }: { form: any }) => (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField control={form.control} name="hospitalData.hospitalName" render={({ field }) => (<FormItem><FormLabel>Hospital Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.licenseNumber" render={({ field }) => (<FormItem><FormLabel>License Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.emergencyContact" render={({ field }) => (<FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.ambulanceCount" render={({ field }) => (<FormItem><FormLabel>Ambulance Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.availableBeds" render={({ field }) => (<FormItem><FormLabel>Available Beds</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.facilities" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Facilities (comma-separated)</FormLabel><FormControl><Input {...field} onChange={e => field.onChange(e.target.value.split(','))} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.operatingHours" render={({ field }) => (<FormItem><FormLabel>Operating Hours</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="hospitalData.website" render={({ field }) => (<FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      </CardContent>
    </Card>
  );

  const LocationForm = ({ form, role }: { form: any; role: 'doctor' | 'pharmacy' }) => {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
      setAutocomplete(autocomplete);
    };
  
    const onPlaceChanged = () => {
      if (autocomplete !== null) {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setCoordinates({ lat, lng });
          form.setValue(`${role}Data.location`, { lat, lng, address: place.formatted_address });
          form.setValue(`${role}Data.address`, place.formatted_address);
        }
      }
    };
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location & Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
            >
              <FormField
                control={form.control}
                name={`${role}Data.address`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Start typing your address..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Autocomplete>
            {coordinates && (
                <div className="h-64 w-full mt-4 rounded-md overflow-hidden">
                    <GoogleMap
                        mapContainerStyle={{ height: "100%", width: "100%" }}
                        center={coordinates}
                        zoom={15}
                    >
                        <Marker position={coordinates} />
                    </GoogleMap>
                </div>
            )}
        </CardContent>
      </Card>
    );
  };