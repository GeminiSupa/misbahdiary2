"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveClient } from "@/app/(app)/clients/actions";
import type { ClientFormValues } from "@/app/(app)/clients/actions";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { clientSchemaForForm, type ClientSchemaForForm } from "@/lib/validation/clients";

type ClientFormProps = {
  initialClient?: ClientFormValues | null;
  initialPortalEnabled?: boolean;
  canSetPortalPassword?: boolean;
  onReset?: () => void;
  onSuccess?: () => void;
};

export function ClientForm({
  initialClient,
  initialPortalEnabled = false,
  canSetPortalPassword = false,
  onReset,
  onSuccess,
}: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [portalEnabled, setPortalEnabled] = useState(initialPortalEnabled);
  const [isPortalUpdating, setIsPortalUpdating] = useState(false);
  const [portalMessage, setPortalMessage] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalPassword, setPortalPassword] = useState("");
  const [portalConfirm, setPortalConfirm] = useState("");
  /** Off by default: access is usually handed off with a firm-set password (no Resend email required). */
  const [portalSendMagicLink, setPortalSendMagicLink] = useState(false);
  const [updatePortalPassword, setUpdatePortalPassword] = useState("");
  const [updatePortalConfirm, setUpdatePortalConfirm] = useState("");
  const [isPortalPasswordUpdating, setIsPortalPasswordUpdating] = useState(false);
  const prevPortalPasswordRef = useRef("");

  const form = useForm<ClientSchemaForForm>({
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

  useEffect(() => {
    setPortalEnabled(initialPortalEnabled);
    setPortalMessage(null);
    setPortalError(null);
    setPortalPassword("");
    setPortalConfirm("");
    setPortalSendMagicLink(false);
    setUpdatePortalPassword("");
    setUpdatePortalConfirm("");
    prevPortalPasswordRef.current = "";
  }, [initialPortalEnabled, initialClient?.id]);

  useEffect(() => {
    const t = portalPassword.trim();
    const prev = prevPortalPasswordRef.current.trim();
    if (t.length > 0 && prev.length === 0) {
      setPortalSendMagicLink(false);
    }
    if (t.length === 0 && prev.length > 0) {
      setPortalSendMagicLink(false);
    }
    prevPortalPasswordRef.current = portalPassword;
  }, [portalPassword]);

  const handleSubmit = async (values: ClientSchemaForForm) => {
    setFormError(null);
    setIsSubmitting(true);

    // Convert form values to match ClientFormValues type expected by saveClient
    const clientValues: ClientFormValues = {
      ...values,
      type: values.type ?? "individual",
      representation: values.representation ?? "self",
      organizationName: values.organizationName || undefined,
    };

    const result = await saveClient(clientValues);

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
          form.setError(key as keyof ClientSchemaForForm, {
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

  const handlePortalToggle = async (checked: boolean) => {
    if (!initialClient?.id || isPortalUpdating) {
      return;
    }

    const previousValue = portalEnabled;
    setPortalMessage(null);
    setPortalError(null);

    const p = portalPassword.trim();
    const c = portalConfirm.trim();
    if (checked && canSetPortalPassword && (p || c)) {
      if (!p || !c || p !== c) {
        setPortalError("Portal password and confirmation must match and cannot be empty.");
        return;
      }
    }

    setPortalEnabled(checked);
    setIsPortalUpdating(true);

    try {
      const endpoint = checked
        ? `/api/lawyer/clients/${initialClient.id}/enable-portal`
        : `/api/lawyer/clients/${initialClient.id}/disable-portal`;

      const enableBody = checked
        ? JSON.stringify(
            p && c && p === c
              ? { password: p, sendMagicLink: portalSendMagicLink }
              : { sendMagicLink: portalSendMagicLink },
          )
        : undefined;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: checked ? { "Content-Type": "application/json" } : undefined,
        body: enableBody,
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Could not update client portal access.");
      }

      if (checked) {
        setPortalMessage(payload.message ?? "Client portal enabled.");
        setPortalPassword("");
        setPortalConfirm("");
        setPortalSendMagicLink(false);
      } else {
        setPortalMessage("Client portal disabled.");
      }
      router.refresh();
    } catch (error) {
      setPortalEnabled(previousValue);
      setPortalError(error instanceof Error ? error.message : "Could not update client portal access.");
    } finally {
      setIsPortalUpdating(false);
    }
  };

  const handleUpdatePortalPassword = async () => {
    if (!initialClient?.id || isPortalPasswordUpdating) return;
    const a = updatePortalPassword.trim();
    const b = updatePortalConfirm.trim();
    if (!a || !b || a !== b) {
      setPortalError("New password and confirmation must match and cannot be empty.");
      return;
    }
    setPortalError(null);
    setPortalMessage(null);
    setIsPortalPasswordUpdating(true);
    try {
      const response = await fetch(`/api/lawyer/clients/${initialClient.id}/set-portal-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: a }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Could not update portal password.");
      }
      setPortalMessage(payload.message ?? "Portal password updated.");
      setUpdatePortalPassword("");
      setUpdatePortalConfirm("");
      router.refresh();
    } catch (error) {
      setPortalError(error instanceof Error ? error.message : "Could not update portal password.");
    } finally {
      setIsPortalPasswordUpdating(false);
    }
  };

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
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Client type</h3>
            </div>

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
                            "rounded-lg border px-3 py-2.5 min-h-[44px] text-base font-medium transition-all sm:px-4 sm:text-sm sm:min-h-[40px]",
                            "active:scale-[0.98]",
                            field.value === option.value
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border hover:border-primary/50 hover:bg-muted/50",
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
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <User className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Basic information</h3>
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
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Contact information</h3>
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
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Representation</h3>
            </div>

            <FormField
              control={form.control}
              name="representation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Representation type</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {clientRepresentationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 min-h-[44px] text-base font-medium transition-all sm:px-4 sm:text-sm sm:min-h-[40px]",
                            "active:scale-[0.98]",
                            field.value === option.value
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border hover:border-primary/50 hover:bg-muted/50",
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
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Identification & location</h3>
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
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Additional information</h3>
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

          {isEditing ? (
            <>
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground">Client Portal</h3>
                    <p className="text-sm text-muted-foreground">
                      Allow this client to log in and view their case details.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={portalEnabled ? "default" : "outline"}
                    size="sm"
                    disabled={isPortalUpdating}
                    onClick={() => void handlePortalToggle(!portalEnabled)}
                    className="min-w-[90px]"
                  >
                    {isPortalUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : portalEnabled ? (
                      "Enabled"
                    ) : (
                      "Disabled"
                    )}
                  </Button>
                </div>
                {!portalEnabled && canSetPortalPassword ? (
                  <div className="space-y-3 rounded-md border border-border/60 bg-background/50 p-3">
                    <p className="text-xs font-medium text-foreground">Portal password (recommended)</p>
                    <p className="text-xs text-muted-foreground">
                      Set a password and share it securely with the client — they sign in at /sign-in with this email and password (no email delivery required). Leave blank only if the client will use a login link or magic link from their email.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground" htmlFor="portal-password">
                          Password
                        </label>
                        <Input
                          id="portal-password"
                          type="password"
                          autoComplete="new-password"
                          value={portalPassword}
                          onChange={(e) => setPortalPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground" htmlFor="portal-confirm">
                          Confirm password
                        </label>
                        <Input
                          id="portal-confirm"
                          type="password"
                          autoComplete="new-password"
                          value={portalConfirm}
                          onChange={(e) => setPortalConfirm(e.target.value)}
                          placeholder="Repeat password"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="portal-send-magic"
                        checked={portalSendMagicLink}
                        onCheckedChange={(v) => setPortalSendMagicLink(v === true)}
                      />
                      <label htmlFor="portal-send-magic" className="text-xs text-muted-foreground cursor-pointer">
                        Also email login link (in addition to password)
                      </label>
                    </div>
                  </div>
                ) : null}
                {portalEnabled && canSetPortalPassword ? (
                  <div className="space-y-3 rounded-md border border-border/60 bg-background/50 p-3">
                    <p className="text-xs font-medium text-foreground">Update portal password</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground" htmlFor="update-portal-pw">
                          New password
                        </label>
                        <Input
                          id="update-portal-pw"
                          type="password"
                          autoComplete="new-password"
                          value={updatePortalPassword}
                          onChange={(e) => setUpdatePortalPassword(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground" htmlFor="update-portal-pw2">
                          Confirm
                        </label>
                        <Input
                          id="update-portal-pw2"
                          type="password"
                          autoComplete="new-password"
                          value={updatePortalConfirm}
                          onChange={(e) => setUpdatePortalConfirm(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isPortalPasswordUpdating}
                      onClick={() => void handleUpdatePortalPassword()}
                    >
                      {isPortalPasswordUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating
                        </>
                      ) : (
                        "Update password"
                      )}
                    </Button>
                  </div>
                ) : null}
                {portalMessage ? <p className="text-sm text-emerald-600">{portalMessage}</p> : null}
                {portalError ? <p className="text-sm text-destructive">{portalError}</p> : null}
              </div>
              <Separator />
            </>
          ) : null}

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
                className="w-full sm:w-auto"
              >
                <RefreshCcw className="mr-2 h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Add New Instead</span>
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span className="whitespace-nowrap">{isEditing ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{isEditing ? "Update Client" : "Create Client"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
