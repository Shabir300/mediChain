"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building,
  ClipboardList,
  Home,
  LogOut,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  Stethoscope,
  User as UserIcon,
  Users,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
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
import { SymptomCheckerSheet } from './patient/symptom-checker-sheet';
import { DoctorAiSheet } from './doctor/doctor-ai-sheet';
import { PharmacyAiSheet } from './pharmacy/pharmacy-ai-sheet';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const patientNavItems: NavItem[] = [
  { href: '/patient', icon: Home, label: 'Dashboard' },
  { href: '/patient/doctors', icon: Search, label: 'Find a Doctor' },
  { href: '/patient/records', icon: ClipboardList, label: 'Medical Records' },
  { href: '/patient/orders', icon: ShoppingCart, label: 'Pharmacy Orders' },
];

const doctorNavItems: NavItem[] = [
  { href: '/doctor', icon: Home, label: 'Dashboard' },
  { href: '/doctor/patients', icon: Users, label: 'Patients' },
  { href: '/doctor/profile', icon: UserIcon, label: 'Profile' },
];

const pharmacyNavItems: NavItem[] = [
  { href: '/pharmacy', icon: Home, label: 'Dashboard' },
];

export function DashboardLayout({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'patient' | 'doctor' | 'pharmacy' }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || user.role !== requiredRole)) {
      router.push('/');
    }
  }, [user, loading, router, requiredRole]);
  
  useEffect(() => {
      if (user?.role === 'patient') {
          const timer = setTimeout(() => {
              toast({
                  title: 'Medication Reminder',
                  description: 'It\'s time to take your Paracetamol.',
                  action: <Button variant="outline" size="sm">Dismiss</Button>
              });
          }, 15000); // 15-second reminder for demo
          return () => clearTimeout(timer);
      }
  }, [user, toast]);

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/');
  };
  
  const handleSOS = () => {
      toast({
          variant: 'destructive',
          title: 'SOS Signal Sent',
          description: 'Emergency request sent to nearby hospital.',
      });
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Logo />
      </div>
    );
  }

  const getNavItems = () => {
    switch (user.role) {
      case 'patient': return patientNavItems;
      case 'doctor': return doctorNavItems;
      case 'pharmacy': return pharmacyNavItems;
      default: return [];
    }
  };

  const getRoleIcon = () => {
      switch (user.role) {
          case 'patient': return <UserIcon className="h-5 w-5 text-muted-foreground" />;
          case 'doctor': return <Stethoscope className="h-5 w-5 text-muted-foreground" />;
          case 'pharmacy': return <Building className="h-5 w-5 text-muted-foreground" />;
      }
  };

  const renderAiChat = () => {
    switch(user.role) {
      case 'patient': return <SymptomCheckerSheet />;
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
            {user.role === 'patient' && (
                 <Button variant="destructive" size="sm" onClick={handleSOS}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> SOS
                 </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2">
                    {getRoleIcon()}
                    <p className="text-sm font-medium leading-none">{user.role}</p>
                  </div>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="relative flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
            {renderAiChat()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
