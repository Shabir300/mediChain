"use client"

import { useState } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useAuth } from "@/context/auth-context"
import { useDataStore } from "@/hooks/use-data-store"
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
import { Upload } from "lucide-react"

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
  const { user } = useAuth();
  const { addDoctor } = useDataStore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    
    addDoctor({
        name: data.fullName,
        specialty: data.specialty,
        // The other fields like bio, education etc. would be stored
        // in a more detailed doctor object in a real database.
        // For this demo, we are only adding the core fields to the list.
    });

    toast({
      title: "Profile Saved",
      description: "Your professional profile has been created and is now visible to patients.",
    })
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
                        {form.getValues('fullName')?.charAt(0) || user?.email.charAt(0).toUpperCase()}
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
                    <Input placeholder="e.g., MD in Cardiology, Stanford University" {...field} />
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
                    <Input placeholder="e.g., HeartCare Center" {...field} />
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
                    <Input placeholder="e.g., 123 Health St., Medville, USA" {...field} />
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
                    placeholder="e.g., 10 years at General Hospital"
                    className="resize-none"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit">Save and Go Live</Button>
        </form>
        </Form>
    </DashboardLayout>
  )
}
