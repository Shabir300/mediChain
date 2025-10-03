
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
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Temporary demo users
const demoUsers = {
    'patient@test.com': { role: 'patient', displayName: 'Demo Patient' },
    'doctor@test.com': { role: 'doctor', displayName: 'Demo Doctor' },
    'pharmacy@test.com': { role: 'pharmacy', displayName: 'Demo Pharmacy' },
}

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signOut: firebaseSignOut, loading } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const [localUser, setLocalUser] = useState<any>(null); // For demo purposes

  const signOut = () => {
    firebaseSignOut();
    setLocalUser(null);
  }

  useEffect(() => {
    setIsClient(true);
    // Ensure any previous session is cleared on page load
    signOut();
  }, []);

  useEffect(() => {
    if (!loading && (user || localUser) && isClient) {
      const currentUser = localUser || user;
      if (currentUser && currentUser.role) {
        switch (currentUser.role) {
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
            toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: 'Your user role is not recognized. Please contact support.',
            });
            signOut();
            break;
        }
      }
    }
  }, [user, localUser, loading, isClient, router, toast]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    // Demo user login
    if (data.email in demoUsers && data.password === 'password') {
        const demoUser = demoUsers[data.email as keyof typeof demoUsers];
        setLocalUser({
            uid: `demo-${demoUser.role}`,
            email: data.email,
            displayName: demoUser.displayName,
            role: demoUser.role,
        });
        toast({
            title: 'Login Successful',
            description: `Welcome back, ${demoUser.displayName}! Redirecting...`,
        });
        return;
    }

    // Real Firebase login
    try {
      const userCredential = await signIn(data.email, data.password);
      if (userCredential.user && firestore) {
          const userDoc = await getDoc(doc(firestore, "users", userCredential.user.uid));
          if (userDoc.exists()) {
              toast({
                  title: 'Login Successful',
                  description: `Welcome back! Redirecting...`,
              });
          } else {
              throw new Error("User document not found.");
          }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password.',
      });
    }
  };

  if (!isClient || (loading && !localUser)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user || localUser) {
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
