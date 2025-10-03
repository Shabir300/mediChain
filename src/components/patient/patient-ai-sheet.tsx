
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientAiAssistant } from '@/ai/flows/patient-ai-assistant';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2, MessageCircle, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useMedicationStore } from '@/hooks/use-medication-store';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Appointment, Order, MedicalRecord } from '@/lib/types';

const querySchema = z.object({
  userQuery: z.string().min(1, { message: 'Please enter a message.' }),
});

type QueryFormValues = z.infer<typeof querySchema>;

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export function PatientAiSheet() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const { data: medicalRecords } = useCollection<MedicalRecord>(firestore && user ? query(collection(firestore, 'patients', user.uid, 'records')) : null);
  const { data: appointments } = useCollection<Appointment>(firestore && user ? query(collection(firestore, 'patients', user.uid, 'appointments')) : null);
  const { data: orders } = useCollection<Order>(firestore && user ? query(collection(firestore, 'patients', user.uid, 'orders')) : null);

  const { medications } = useMedicationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      userQuery: '',
    }
  });

  const onSubmit = async (data: QueryFormValues) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: data.userQuery };
    
    const currentChatHistory = chatHistory.map(msg => `${msg.sender === 'user' ? 'Patient' : 'AI Assistant'}: ${msg.text}`).join('\n');
    const medicalHistoryText = medicalRecords?.map(rec => rec.fileName).join(', ') || '';
    const appointmentsText = appointments?.map(a => `${a.date} with ${a.doctorName}`).join(', ') || '';
    const medicationsText = medications.map(m => `${m.name} at ${m.time}`).join(', ');
    const ordersText = orders?.map(o => `Order on ${o.date} for PKR ${o.total}`).join(', ') || '';


    setChatHistory(prev => [...prev, userMessage]);
    form.reset({userQuery: ''});


    try {
      const result = await patientAiAssistant({ 
        userQuery: data.userQuery,
        chatHistory: currentChatHistory,
        medicalHistory: medicalHistoryText,
        appointments: appointmentsText,
        medications: medicationsText,
        orders: ordersText,
      });
      const aiMessage: ChatMessage = { sender: 'ai', text: result.response };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage: ChatMessage = { sender: 'ai', text: "I'm sorry, I encountered an error. Please try again later." };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg" size="icon">
            <Bot className="h-8 w-8"/>
            <span className="sr-only">Open AI Assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline flex items-center gap-2"><Bot /> AI Assistant</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto rounded-md border bg-muted/50 p-4 my-4">
            {chatHistory.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                    <MessageCircle className="mr-2 h-8 w-8 mb-2" />
                    <p className='font-bold'>Your personal health assistant.</p>
                    <p className='text-xs mt-2'>Ask about your symptoms, budget, or medical records.</p>
                </div>
            ) : (
                chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                         {msg.sender === 'ai' && <Bot className="h-6 w-6 shrink-0 text-accent" />}
                        <div className={`max-w-md rounded-lg p-3 ${msg.sender === 'user' ? 'bg-primary/80 text-primary-foreground' : 'bg-background'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {msg.sender === 'user' && <User className="h-6 w-6 shrink-0" />}
                    </div>
                ))
            )}
             {isLoading && (
                <div className="flex items-start gap-3">
                    <Bot className="h-6 w-6 shrink-0 text-accent" />
                    <div className="max-w-xs rounded-lg bg-background p-3 flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                </div>
            )}
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="userQuery"
            render={({ field }) => (
                <FormItem>
                <FormLabel>How can I help you today?</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="e.g., How much have I spent on doctors this month?"
                    {...field}
                    disabled={isLoading}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Message'}
            </Button>
        </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
