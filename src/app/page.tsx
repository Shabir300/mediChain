
"use client";

import { useEffect, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import type { User as AppUser } from '@/lib/types';


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, loading, setAuthUser } = useAuth();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && user && isClient && user.role) {
        switch (user.role) {
          case 'patient':
            router.push('/patient');
            break;
          case 'doctor':
            router.push('/doctor');
            break;
          case 'pharmacy':
            router.push('/pharmacy');
            break;
          default:
             // Stay on the login page if role is not determined
            break;
        }
    }
  }, [user, loading, isClient, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
     // Demo accounts for quick access
    if (data.password === 'password') {
        let demoUser: AppUser | null = null;
        if (data.email === 'patient@test.com') {
            demoUser = { uid: 'patient-test-id', email: 'patient@test.com', displayName: 'Test Patient', role: 'patient' };
        } else if (data.email === 'doctor@test.com') {
            demoUser = { uid: 'doctor-test-id', email: 'doctor@test.com', displayName: 'Test Doctor', role: 'doctor' };
        } else if (data.email === 'pharmacy1@test.com') {
            demoUser = { uid: 'pharmacy1-test-id', email: 'pharmacy1@test.com', displayName: 'CureLink Pharmacy', role: 'pharmacy', pharmacyName: 'CureLink Pharmacy' };
        } else if (data.email === 'pharmacy2@test.com') {
            demoUser = { uid: 'pharmacy2-test-id', email: 'pharmacy2@test.com', displayName: 'HealthPlus Meds', role: 'pharmacy', pharmacyName: 'HealthPlus Meds' };
        } else if (data.email === 'pharmacy3@test.com') {
            demoUser = { uid: 'pharmacy3-test-id', email: 'pharmacy3@test.com', displayName: 'Wellness Rx', role: 'pharmacy', pharmacyName: 'Wellness Rx' };
        }
        
        if (demoUser) {
            setAuthUser(demoUser);
            toast({
              title: 'Login Successful',
              description: `Welcome, ${demoUser.displayName}! Redirecting...`,
            });
            return;
        }
    }

    // Regular login
    try {
      const userCredential = await signIn(data.email, data.password);
      if (userCredential.user) {
        toast({
          title: 'Login Successful',
          description: `Welcome back! Redirecting...`,
        });
        // The useEffect will handle the redirection once the user object with role is populated.
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password.',
      });
    }
  };

  if (!isClient || (loading && !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-3xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
                Login
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-accent-foreground underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
