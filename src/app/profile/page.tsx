
"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/context/auth-context";

export default function ProfilePage() {
    const { user } = useAuth();
    if(!user) return null;

  return (
    <DashboardLayout requiredRole={user.role}>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and role-specific information.
          </p>
        </div>
        <ProfileForm />
      </div>
    </DashboardLayout>
  );
}
