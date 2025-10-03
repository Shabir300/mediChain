"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// This can be set to a default value or fetched from a database.
const defaultValues: Partial<ProfileFormValues> = {
  fullName: "",
  specialty: "",
  bio: "",
  education: "",
  clinicName: "",
  address: "",
  previousExperience: "",
}

export default function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: "Profile Updated",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <DashboardLayout requiredRole="doctor">
        <h1 className="font-headline text-3xl md:text-4xl">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-1">Please fill out your professional details.</p>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
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
            <Button type="submit">Save Profile</Button>
        </form>
        </Form>
    </DashboardLayout>
  )
}
