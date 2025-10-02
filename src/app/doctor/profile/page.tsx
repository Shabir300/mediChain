"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  specialities: z.string().max(160).min(4),
  clinicName: z.string().max(160).min(4),
  address: z.string().max(160).min(4),
  education: z.string().max(160).min(4),
  city: z.string().max(160).min(4),
  country: z.string().max(160).min(4),
  previousExperience: z.string().max(160).min(4),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// This can be set to a default value or fetched from a database.
const defaultValues: Partial<ProfileFormValues> = {
  name: "Dr. John Doe",
  specialities: "Cardiologist",
  clinicName: "Heart Care Clinic",
  address: "123, Health Street, Medcity",
  education: "MD in Cardiology",
  city: "New York",
  country: "USA",
  previousExperience: "General Hospital",
}

export default function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialities</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about your specialities"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can mention your specialities, experience and other details.
              </FormDescription>
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
                <Input placeholder="Your clinic name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of your clinic.
              </FormDescription>
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
                <Input placeholder="Your address" {...field} />
              </FormControl>
              <FormDescription>
                This is your clinic address.
              </FormDescription>
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
                <Input placeholder="Your education" {...field} />
              </FormControl>
              <FormDescription>
                Your educational qualifications.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Your city" {...field} />
              </FormControl>
              <FormDescription>
                The city where your clinic is located.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="Your country" {...field} />
              </FormControl>
              <FormDescription>
                The country where your clinic is located.
              </FormDescription>
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
                  placeholder="Tell us a little bit about your previous experience"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can mention your previous work experience.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  )
}
