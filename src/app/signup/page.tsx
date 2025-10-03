
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { updateProfile } from 'firebase/auth';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required.' }),
  pharmacyName: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['patient', 'doctor', 'pharmacy'], {
    required_error: 'You need to select a role.',
  }),
}).refine(data => {
    if (data.role === 'pharmacy') {
        return !!data.pharmacyName && data.pharmacyName.length > 0;
    }
    return true;
}, {
    message: 'Pharmacy name is required.',
    path: ['pharmacyName'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      pharmacyName: '',
      email: '',
      password: '',
    },
  });

  const role = form.watch('role');

  const onSubmit = async (data: SignupFormValues) => {
    if (!firestore || !signUp) return;

    try {
      const userCredential = await signUp(data.email, data.password);
      const user = userCredential?.user;
      
      if (user) {
        // Step 1: Update the user's auth profile
        await updateProfile(user, { displayName: data.fullName });

        // Step 2: Create the user document in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: data.fullName,
          role: data.role,
          ...(data.role === 'pharmacy' && { pharmacyName: data.pharmacyName }),
        };

        await setDoc(userDocRef, userData);
        
        // Step 3: Notify user and redirect
        toast({
          title: 'Signup Successful',
          description: 'Your account has been created. Please log in.',
        });
        router.push('/');
      } else {
        throw new Error("Account was not created in Firebase Authentication.");
      }
    } catch (error: any) {
      console.error('Signup Error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.code === 'auth/email-already-in-use' 
            ? 'This email address is already in use. Please try logging in.'
            : (error.message || 'An error occurred during signup.'),
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>Join CureLink to manage your healthcare journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {role === 'pharmacy' && (
                <FormField
                  control={form.control}
                  name="pharmacyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pharmacy Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CureLink Pharmacy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
                Create Account
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/" className="font-semibold text-accent-foreground underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
