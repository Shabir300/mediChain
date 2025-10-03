"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { symptomChecker } from '@/ai/flows/ai-symptom-checker';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2, MessageCircle, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useDataStore } from '@/hooks/use-data-store';

const symptomSchema = z.object({
  symptomDescription: z.string().min(2, { message: 'Please describe your symptoms.' }),
});

type SymptomFormValues = z.infer<typeof symptomSchema>;

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export function PatientAiSheet() {
  const { medicalRecords } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<SymptomFormValues>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptomDescription: '',
    }
  });

  const onSubmit = async (data: SymptomFormValues) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: data.symptomDescription };
    
    const historyText = chatHistory.map(msg => `${msg.sender === 'user' ? 'Patient' : 'AI Assistant'}: ${msg.text}`).join('\n');
    const medicalHistoryText = medicalRecords.map(rec => `${rec.type} - ${rec.fileName} (${rec.uploadDate})`).join('; ');

    setChatHistory(prev => [...prev, userMessage]);
    form.reset({symptomDescription: ''});


    try {
      const result = await symptomChecker({ 
        symptomDescription: data.symptomDescription,
        chatHistory: historyText,
        medicalHistory: medicalHistoryText,
      });
      const aiMessage: ChatMessage = { sender: 'ai', text: result.guidance };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Symptom Checker Error:', error);
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
                    <p className='font-bold'>Describe your symptoms to get instant guidance.</p>
                    <p className='text-xs mt-2'>This is not a substitute for professional medical advice.</p>
                </div>
            ) : (
                chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                         {msg.sender === 'ai' && <Bot className="h-6 w-6 shrink-0 text-accent" />}
                        <div className={`max-w-xs rounded-lg p-3 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
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
            name="symptomDescription"
            render={({ field }) => (
                <FormItem>
                <FormLabel>How can I help you today?</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="e.g., I have a high fever, a sore throat, and a headache."
                    {...field}
                    disabled={isLoading}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Get AI Guidance'}
            </Button>
        </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
