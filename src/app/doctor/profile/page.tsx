"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2 } from "lucide-react"

const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(50, {
      message: "Name must not be longer than 50 characters.",
    }),
  specialty: z.string().min(2, "Specialty is required."),
  bio: z.string().max(500, "Bio should not exceed 500 characters.").min(10, "Bio should be at least 10 characters."),
  education: z.string().min(2, "Education details are required."),
  clinicName: z.string().min(2, "Clinic name is required."),
  address: z.string().min(5, "Address is required."),
  previousExperience: z.string().min(2, "Previous experience is required."),
  profilePicture: z.any().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileForm() {
  const { user } = useAuth()
  const firestore = useFirestore()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const doctorProfileRef = firestore && user ? doc(firestore, "doctors", user.uid) : null;
  const { data: doctorProfile, loading: profileLoading } = useDoc(doctorProfileRef);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      specialty: "",
      bio: "",
      education: "",
      clinicName: "",
      address: "",
      previousExperience: "",
    },
    mode: "onChange",
  })
  
  useEffect(() => {
    if (doctorProfile) {
        form.reset({
            fullName: doctorProfile.fullName || user?.displayName || '',
            specialty: doctorProfile.specialty || '',
            bio: doctorProfile.bio || '',
            education: doctorProfile.education || '',
            clinicName: doctorProfile.clinicName || '',
            address: doctorProfile.address || '',
            previousExperience: doctorProfile.previousExperience || '',
        });
        if (doctorProfile.avatar) {
            setAvatarPreview(doctorProfile.avatar);
        }
    } else if (user?.displayName) {
        form.setValue('fullName', user.displayName);
    }
  }, [doctorProfile, user, form]);


  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore || !doctorProfileRef) return;

    try {
        const docSnap = await getDoc(doctorProfileRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};

        const dataToSave = {
            ...existingData,
            uid: user.uid,
            email: user.email,
            fullName: data.fullName,
            specialty: data.specialty,
            bio: data.bio,
            education: data.education,
            clinicName: data.clinicName,
            address: data.address,
            previousExperience: data.previousExperience,
            avatar: avatarPreview || '',
            location: existingData.location || 'In City',
            availability: existingData.availability || 'Online',
            rating: existingData.rating || 4.5,
        };

        await setDoc(doctorProfileRef, dataToSave);

        toast({
            title: "Profile Saved",
            description: "Your professional profile has been updated.",
        });
    } catch (error) {
        console.error("Error saving profile: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save your profile. Please try again.",
        });
    }
  }

  const handlePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  if (profileLoading) {
      return (
          <DashboardLayout requiredRole="doctor">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Loading Profile...</p>
              </div>
          </DashboardLayout>
      )
  }

  return (
    <DashboardLayout requiredRole="doctor">
        <h1 className="font-headline text-3xl md:text-4xl">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-1">Fill out your professional details to be listed for patients.</p>
        
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
            <div className="flex items-center gap-4">
                 <Avatar className="h-24 w-24">
                    {avatarPreview && <AvatarImage src={avatarPreview} alt="Profile Preview" />}
                    <AvatarFallback className="text-3xl">
                        {form.getValues('fullName')?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Button asChild variant="outline">
                                    <label htmlFor="profile-picture-upload" className="cursor-pointer">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Image
                                    </label>
                                </Button>
                                <Input 
                                    id="profile-picture-upload"
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handlePictureChange}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Dr. John Doe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Occupation / Specialty</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Cardiologist" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Doctor's Bio</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="Tell us a little bit about yourself, your approach to patient care, and your expertise."
                    className="resize-none"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Education</FormLabel>
                <FormControl>
                    <Input placeholder="MD in Cardiology, Stanford University" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="clinicName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Clinic Name</FormLabel>
                <FormControl>
                    <Input placeholder="HeartCare Center" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                    <Input placeholder="123 Health St., Medville, USA" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
           
            <FormField
            control={form.control}
            name="previousExperience"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Previous Experience</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="10 years at General Hospital"
                    className="resize-none"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save and Go Live
            </Button>
        </form>
        </Form>
    </DashboardLayout>
  )
}
