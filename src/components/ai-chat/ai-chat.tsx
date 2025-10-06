'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Paperclip, Mic, Send, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage } from '@/lib/gemini';

// Helper functions to call our new secure API route
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const response = await fetch('/api/speech', {
    method: 'POST',
    body: audioBlob,
  });
  const data = await response.json();
  return data.transcription || '';
}

async function synthesizeSpeech(text: string): Promise<Blob> {
    const response = await fetch('/api/speech', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text }),
    });
    return response.blob();
}


export const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const scrollAreaRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: {role: 'user' | 'model', content: string}[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
        const aiResponse = await sendMessage(newMessages, input);
        const responseText =  aiResponse;
    
        setMessages([...newMessages, { role: 'model', content: responseText }]);
    } catch (error) {
        console.error("Error sending message:", error);
        setMessages([...newMessages, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const chunks: Blob[] = [];
    
        mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.current.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(blob);
          transcribeAndSend(blob);
        };
    
        mediaRecorder.current.start();
        setIsRecording(true);
    } catch (error) {
        console.error("Microphone access denied:", error);
        // You could add a message to the user here
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const transcribeAndSend = async (blob: Blob) => {
    const transcript = await transcribeAudio(blob);
    if(transcript) {
        setInput(transcript);
        // Automatically send the transcribed message
        const newMessages: {role: 'user' | 'model', content: string}[] = [...messages, { role: 'user', content: transcript }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            const aiResponse = await sendMessage(newMessages, transcript);
            const responseText =  aiResponse;
        
            setMessages([...newMessages, { role: 'model', content: responseText }]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages([...newMessages, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    }
  };

  const playAIResponse = async (text: string) => {
    const audioBlob = await synthesizeSpeech(text);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      (scrollAreaRef.current as any).scrollTo({
        top: (scrollAreaRef.current as any).scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 right-8 w-96 h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">AI Health Assistant</h2>
              <Button variant="ghost" size="icon" onClick={toggleChat}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                    {msg.role === 'model' && (
                        <Button variant="ghost" size="icon" onClick={() => playAIResponse(msg.content)} className="shrink-0">
                            <Volume2 className="w-5 h-5" />
                        </Button>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                      <p>AI is thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t flex items-center">
              <Button variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 mx-2"
              />
              <Button 
                variant="ghost" 
                size="icon"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                className={isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}
                >
                <Mic className="w-5 h-5" />
              </Button>
              <Button onClick={handleSend} size="icon">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isOpen && (
        <motion.div
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-8 right-8"
      >
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full w-16 h-16"
        >
          {isOpen ? <X /> : 'AI'}
        </Button>
      </motion.div>
      )}
    </>
  );
};
