"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { symptomChecker } from '@/ai/flows/ai-symptom-checker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const symptomSchema = z.object({
  symptomDescription: z.string().min(10, { message: 'Please describe your symptoms in at least 10 characters.' }),
});

type SymptomFormValues = z.infer<typeof symptomSchema>;

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export function SymptomChecker() {
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const form = useForm<SymptomFormValues>({
    resolver: zodResolver(symptomSchema),
  });

  const onSubmit = async (data: SymptomFormValues) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: data.symptomDescription };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const result = await symptomChecker({ symptomDescription: data.symptomDescription });
      const aiMessage: ChatMessage = { sender: 'ai', text: result.guidance };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Symptom Checker Error:', error);
      const errorMessage: ChatMessage = { sender: 'ai', text: "I'm sorry, I encountered an error. Please try again later." };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      form.reset({symptomDescription: ''});
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Symptom Checker</CardTitle>
        <CardDescription>Describe your symptoms to get instant guidance. This is not a substitute for professional medical advice.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="h-64 space-y-4 overflow-y-auto rounded-md border bg-muted/50 p-4">
                {chatHistory.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Bot className="mr-2 h-5 w-5" />
                        <span>AI chat will appear here.</span>
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
                    <FormLabel>Your Symptoms</FormLabel>
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
        </div>
      </CardContent>
    </Card>
  );
}
