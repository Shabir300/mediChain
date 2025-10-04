
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
  }),
});

const pharmacySchema = baseSchema.extend({
  pharmacyData: z.object({
    pharmacyName: z.string().optional(),
    licenseNumber: z.string().optional(),
    address: z.string().optional(),
    operatingHours: z.string().optional(),
    contactNumber: z.string().optional(),
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
      
      const roleDataKey = `${user!.role}Data`;
      const updatedData = {
          ...data,
          [roleDataKey]: {
              ...(user as any)[roleDataKey],
              ...data[roleDataKey],
              profileImage: imageUrl,
          }
      };

      await updateUser(user!.uid, updatedData);
      setUser(updatedData);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                <PharmacyForm form={form} />
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
  );
  
  const PharmacyForm = ({ form }: { form: any }) => (
    <Card>
      <CardHeader>
        <CardTitle>Pharmacy Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField control={form.control} name="pharmacyData.pharmacyName" render={({ field }) => (<FormItem><FormLabel>Pharmacy Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="pharmacyData.licenseNumber" render={({ field }) => (<FormItem><FormLabel>License Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="pharmacyData.address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="pharmacyData.operatingHours" render={({ field }) => (<FormItem><FormLabel>Operating Hours</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="pharmacyData.contactNumber" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      </CardContent>
    </Card>
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