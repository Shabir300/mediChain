
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMedicationStore } from '@/hooks/use-medication-store';
import { ToastAction } from '../ui/toast';

export function MedicationReminder() {
    const { medications } = useMedicationStore();
    const { toast, dismiss } = useToast();

    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            medications.forEach(med => {
                if (med.time === currentTime) {
                    const toastId = `med-toast-${med.id}-${currentTime}`;
                    // A simple way to avoid re-notifying for the same minute
                    if (!sessionStorage.getItem(toastId)) {
                        const { id } = toast({
                            title: 'Medication Reminder',
                            description: `It's time to take your ${med.name}.`,
                            action: (
                                <ToastAction altText="Dismiss" onClick={() => dismiss(id)}>
                                    Dismiss
                                </ToastAction>
                            ),
                            duration: 30000,
                        });
                        sessionStorage.setItem(toastId, 'true');
                    }
                }
            });
        };

        // Check every minute
        const interval = setInterval(checkReminders, 60000);

        // Run on mount as well
        checkReminders();

        return () => clearInterval(interval);
    }, [medications, toast, dismiss]);

    return null; // This is a non-visual component
}
