"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Mail, MessageCircle } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (values: ContactFormValues) => {
    startTransition(async () => {
      try {
        // Create mailto link with pre-filled email
        const mailtoLink = `mailto:info@ux4u.online?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(
          `Name: ${values.name}\nEmail: ${values.email}\n\nMessage:\n${values.message}`
        )}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show success message
        toast({
          title: "Email Client Opened",
          description: "Your email client should open with a pre-filled message. If not, please email us at info@ux4u.online",
        });

        // Reset form
        form.reset();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to open email client. Please email us directly at info@ux4u.online",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Your name"
          disabled={isPending}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="your.email@example.com"
          disabled={isPending}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          {...form.register("subject")}
          placeholder="What is this regarding?"
          disabled={isPending}
        />
        {form.formState.errors.subject && (
          <p className="text-sm text-destructive">
            {form.formState.errors.subject.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          {...form.register("message")}
          placeholder="Your message..."
          rows={5}
          disabled={isPending}
        />
        {form.formState.errors.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.message.message}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send via Email
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.open("https://wa.me/923255116929", "_blank");
          }}
          className="flex-1"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Or contact us directly:{" "}
        <a href="mailto:info@ux4u.online" className="text-primary hover:underline">
          info@ux4u.online
        </a>{" "}
        |{" "}
        <a
          href="https://wa.me/923255116929"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          +92 325 511 6929
        </a>
      </p>
    </form>
  );
}
