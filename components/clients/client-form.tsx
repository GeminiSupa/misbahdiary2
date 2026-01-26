// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveClient, type ClientFormValues } from "@/app/(app)/clients/actions";
import {
  clientTypeOptions,
  clientRepresentationOptions,
  representativeCapacityOptions,
} from "@/lib/constants/clients";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  RefreshCcw,
  User,
  Building2,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  FileText,
  CheckCircle2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clientSchemaForForm } from "@/lib/validation/clients";

type ClientFormProps = {
  initialClient?: ClientFormValues | null;
  onReset?: () => void;
  onSuccess?: () => void;
};

export function ClientForm({ initialClient, onReset, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchemaForForm),
    defaultValues: {
      id: initialClient?.id,
      type: initialClient?.type ?? "individual",
      fullName: initialClient?.fullName ?? "",
      fatherName: initialClient?.fatherName ?? "",
      organizationName: initialClient?.organizationName ?? "",
      email: initialClient?.email ?? "",
      phone: initialClient?.phone ?? "",
      cnic: initialClient?.cnic ?? "",
      address: initialClient?.address ?? "",
      city: initialClient?.city ?? "",
      province: initialClient?.province ?? "",
      country: initialClient?.country ?? "Pakistan",
      notes: initialClient?.notes ?? "",
      representation: initialClient?.representation ?? "self",
      representativeToWhom: initialClient?.representativeToWhom ?? "",
      representativeCapacity: initialClient?.representativeCapacity ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      id: initialClient?.id,
      type: initialClient?.type ?? "individual",
      fullName: initialClient?.fullName ?? "",
      fatherName: initialClient?.fatherName ?? "",
      organizationName: initialClient?.organizationName ?? "",
      email: initialClient?.email ?? "",
      phone: initialClient?.phone ?? "",
      cnic: initialClient?.cnic ?? "",
      address: initialClient?.address ?? "",
      city: initialClient?.city ?? "",
      province: initialClient?.province ?? "",
      country: initialClient?.country ?? "Pakistan",
      notes: initialClient?.notes ?? "",
      representation: initialClient?.representation ?? "self",
      representativeToWhom: initialClient?.representativeToWhom ?? "",
      representativeCapacity: initialClient?.representativeCapacity ?? "",
    });
  }, [initialClient, form]);

  const handleSubmit = async (values: ClientFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await saveClient(values);

    if (result.success) {
      router.refresh();
      if (!values.id) {
        form.reset({
          type: "individual",
          fullName: "",
          fatherName: "",
          organizationName: "",
          email: "",
          phone: "",
          cnic: "",
          address: "",
          city: "",
          province: "",
          country: "Pakistan",
          notes: "",
          representation: "self",
          representativeToWhom: "",
          representativeCapacity: "",
        });
      }
      onReset?.();
      onSuccess?.();
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof ClientFormValues, {
            type: "server",
            message,
          });
        }
      });
    }

    if (result.message) {
      setFormError(result.message);
    }

    setIsSubmitting(false);
  };

  const isEditing = Boolean(initialClient?.id);
  const representation = useWatch({ control: form.control, name: "representation" });
  const clientType = useWatch({ control: form.control, name: "type" });

  return (
    <div className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Could not save client</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Client Type */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Client Type</h3>
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Type</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {clientTypeOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "rounded-lg border-2 px-3 py-2.5 min-h-[44px] text-base font-medium transition-all sm:px-4 sm:text-sm sm:min-h-[40px]",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            field.value === option.value
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Adv. Zara Ahmed" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {clientType === "individual" && (
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father / Guardian Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Daughter of Malik Riaz" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {clientType === "organization" && (
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      Organization Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Khan & Co. Pvt Ltd" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Mail className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="client@law.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+92 300 1234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Representation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Representation</h3>
            </div>

            <FormField
              control={form.control}
              name="representation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Representation Type</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {clientRepresentationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "rounded-lg border-2 px-3 py-2.5 min-h-[44px] text-base font-medium transition-all sm:px-4 sm:text-sm sm:min-h-[40px]",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            field.value === option.value
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {representation === "representative" && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="representativeToWhom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Represents</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC Holdings" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="representativeCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className={cn(
                            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                          )}
                        >
                          <option value="">Select capacity</option>
                          {representativeCapacityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Identification & Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Identification & Location</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="cnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5" />
                      CNIC / ID
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="3520212345678" maxLength={13} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Lahore" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Punjab" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Pakistan" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Office #12, Jinnah Avenue, Islamabad"
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Additional Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Additional Information</h3>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Key preferences, recent communication, billing instructions..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Add any important notes or reminders about this client
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Submit Button */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onReset?.();
                  form.reset({
                    type: "individual",
                    fullName: "",
                    fatherName: "",
                    organizationName: "",
                    email: "",
                    phone: "",
                    cnic: "",
                    address: "",
                    city: "",
                    province: "",
                    country: "Pakistan",
                    notes: "",
                    representation: "self",
                    representativeToWhom: "",
                    representativeCapacity: "",
                  });
                  setFormError(null);
                }}
                disabled={isSubmitting}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Add New Instead
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isEditing ? "Update Client" : "Create Client"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
