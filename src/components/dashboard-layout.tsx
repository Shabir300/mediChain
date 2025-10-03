
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building,
  Calendar,
  ClipboardList,
  Home,
  LogOut,
  LineChart,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  Star,
  Stethoscope,
  User as UserIcon,
  Users,
  Hospital,
  Pill,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/firebase';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { useToast } from '@/hooks/use-toast';
import { PatientAiSheet } from './patient/patient-ai-sheet';
import { DoctorAiSheet } from './doctor/doctor-ai-sheet';
import { PharmacyAiSheet } from './pharmacy/pharmacy-ai-sheet';
import { ToastAction } from './ui/toast';
import { MedicationReminder } from './patient/medication-reminder';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const patientNavItems: NavItem[] = [
  { href: '/patient', icon: Home, label: 'Dashboard' },
  { href: '/patient/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/patient/doctors', icon: Search, label: 'Find a Doctor' },
  { href: '/patient/hospitals', icon: Hospital, label: 'Hospitals' },
  { href: '/patient/medication', icon: Pill, label: 'Medication' },
  { href: '/patient/records', icon: ClipboardList, label: 'Medical Records' },
  { href: '/patient/orders', icon: ShoppingCart, label: 'Pharmacy Orders' },
  { href: '/patient/budget', icon: DollarSign, label: 'Budget' },
];

const doctorNavItems: NavItem[] = [
  { href: '/doctor', icon: Home, label: 'Dashboard' },
  { href: '/doctor/meetings', icon: Calendar, label: 'Meetings' },
  { href: '/doctor/patients', icon: Users, label: 'Patients' },
  { href: '/doctor/earnings', icon: LineChart, label: 'Earnings' },
  { href: '/doctor/reviews', icon: Star, label: 'Reviews' },
  { href: '/doctor/profile', icon: UserIcon, label: 'Profile' },
];

const pharmacyNavItems: NavItem[] = [
  { href: '/pharmacy', icon: Home, label: 'Dashboard' },
  { href: '/pharmacy/orders', icon: ShoppingCart, label: 'Incoming Orders' },
  { href: '/pharmacy/inventory', icon: Package, label: 'Inventory' },
];

export function DashboardLayout({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'patient' | 'doctor' | 'pharmacy' }) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast, dismiss } = useToast();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsInitialLoad(false);
      if (!user) {
        router.push('/');
      } else if (user.role && user.role !== requiredRole) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.',
        });
        router.push('/');
      }
    }
  }, [user, loading, router, requiredRole, toast]);


  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/');
  };
  
  const handleSOS = () => {
      const { id } = toast({
          variant: 'destructive',
          title: 'SOS Signal Sent',
          description: 'Emergency request sent to nearby hospital.',
          action: <ToastAction altText="Dismiss" onClick={() => dismiss(id)}>Dismiss</ToastAction>,
      });
  };

  const currentUser = user;
  const userRole = currentUser?.role;

  if (isInitialLoad && loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-muted-foreground flex items-center gap-2 mt-4"><Loader2 className="animate-spin h-5 w-5"/>Verifying access...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-muted-foreground flex items-center gap-2 mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }


  const getNavItems = () => {
    switch (userRole) {
      case 'patient': return patientNavItems;
      case 'doctor': return doctorNavItems;
      case 'pharmacy': return pharmacyNavItems;
      default: return [];
    }
  };

  const getRoleIcon = () => {
      switch (userRole) {
          case 'patient': return <UserIcon className="h-5 w-5 text-muted-foreground" />;
          case 'doctor': return <Stethoscope className="h-5 w-5 text-muted-foreground" />;
          case 'pharmacy': return <Building className="h-5 w-5 text-muted-foreground" />;
          default: return null;
      }
  };

  const renderAiChat = () => {
    switch(userRole) {
      case 'patient': return <PatientAiSheet />;
      case 'doctor': return <DoctorAiSheet />;
      case 'pharmacy': return <PharmacyAiSheet />;
      default: return null;
    }
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <div className="flex w-full items-center justify-between p-2">
            <Link href="/" className="shrink-0">
               <Logo />
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {getNavItems().map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    tooltip={{ children: item.label }}
                    isActive={pathname === item.href}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="md:hidden" />
          <div className="flex w-full items-center justify-end gap-4">
            {userRole === 'patient' && (
                 <Button variant="destructive" size="sm" onClick={handleSOS}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> SOS
                 </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{currentUser.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2">
                    {getRoleIcon()}
                    <p className="text-sm font-medium leading-none capitalize">{userRole}</p>
                  </div>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {currentUser.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userRole === 'doctor' && (
                  <DropdownMenuItem asChild>
                    <Link href="/doctor/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="relative flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {userRole === 'patient' && <MedicationReminder />}
            {children}
            {renderAiChat()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
