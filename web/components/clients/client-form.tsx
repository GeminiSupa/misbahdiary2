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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { clientSchemaForForm } from "@/lib/validation/clients";

type ClientFormProps = {
  initialClient?: ClientFormValues | null;
  onReset?: () => void;
};

export function ClientForm({ initialClient, onReset }: ClientFormProps) {
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

  return (
    <div className="space-y-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save client</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="sap-form">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client type</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {clientTypeOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "rounded-lg border px-3 py-1 text-sm transition",
                          field.value === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/60",
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

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Adv. Zara Ahmed" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Father / Guardian name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Daughter of Malik Riaz" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization (if applicable)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Khan & Co. Pvt Ltd" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+92 300 1234567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="representation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Representation</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {clientRepresentationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "rounded-lg border px-3 py-1 text-sm transition",
                          field.value === option.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/60",
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

          {useWatch({ control: form.control, name: "representation" }) === "representative" ? (
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
                          "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
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
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="cnic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNIC / ID</FormLabel>
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
                  <Textarea {...field} rows={2} placeholder="Office #12, Jinnah Avenue, Islamabad" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? "Update client" : "Create client"}
            </Button>
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
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
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Add new instead
              </Button>
            ) : null}
          </div>
        </form>
      </Form>
    </div>
  );
}

