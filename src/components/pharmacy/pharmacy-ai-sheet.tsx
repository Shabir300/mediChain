
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientStockAlert } from '@/ai/flows/patient-stock-alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2, MessageCircle, User, PackageSearch } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const promptSchema = z.object({
  prompt: z.string().min(2, { message: 'Please enter a prompt.' }),
});

type PromptFormValues = z.infer<typeof promptSchema>;

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export function PharmacyAiSheet() {
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: '',
    }
  });

  const onSubmit = async (data: PromptFormValues) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: data.prompt };
    
    setChatHistory(prev => [...prev, userMessage]);
    form.reset({prompt: ''});

    // This is now an agentic check. It uses a tool to check patient's stock and decide if a reorder is needed.
    if (data.prompt.toLowerCase().includes('stock') || data.prompt.toLowerCase().includes('paracetamol')) {
        try {
            const result = await patientStockAlert({
                productName: 'Paracetamol 500mg',
                currentStock: 2, // Mock low stock for the patient
            });
            const aiMessage: ChatMessage = { sender: 'ai', text: result.alertMessage };
            setChatHistory(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI Pharmacy Assistant Error:', error);
            const errorMessage: ChatMessage = { sender: 'ai', text: "I'm sorry, I couldn't fetch the stock details." };
            setChatHistory(prev => [...prev, errorMessage]);
        }
    } else {
        const aiMessage: ChatMessage = { sender: 'ai', text: "I can help with stock alerts for your personal medication. For example, try 'Check my stock for Paracetamol'." };
        setChatHistory(prev => [...prev, aiMessage]);
    }

    setIsLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg" size="icon">
            <PackageSearch className="h-8 w-8"/>
            <span className="sr-only">Open AI Pharmacy Assistant</span>
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
                    <p className='font-bold'>Your AI assistant for inventory management.</p>
                    <p className='text-xs mt-2'>Try "Do I need to reorder any medication?".</p>
                </div>
            ) : (
                chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                         {msg.sender === 'ai' && <Bot className="h-6 w-6 shrink-0 text-accent" />}
                        <div className={`max-w-xs rounded-lg p-3 ${msg.sender === 'user' ? 'bg-primary/80 text-primary-foreground' : 'bg-background'}`}>
                           <p className="text-sm">{msg.text}</p>
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
                        <span>Checking...</span>
                    </div>
                </div>
            )}
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ask about your medication stock</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="e.g., Check my stock for Paracetamol"
                    {...field}
                    disabled={isLoading}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send'}
            </Button>
        </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
