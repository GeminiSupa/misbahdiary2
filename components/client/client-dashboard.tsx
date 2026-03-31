"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ClientCase = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  case_type: string | null;
  court_name: string | null;
  filing_date: string | null;
};

type ClientHearing = {
  id: string;
  case_id: string | null;
  scheduled_at: string;
  status: string;
  location: string | null;
  judge: string | null;
  notes: string | null;
};

type ClientPayment = {
  id: string;
  case_id: string | null;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  total_amount: number;
  amount_paid: number;
  billing_currency: string;
};

type ApiResponse<T> = {
  data: T[];
  message?: string;
};

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: currencyCode || "PKR",
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  } catch {
    return `${amount ?? 0}`;
  }
}

export function ClientDashboard() {
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [hearings, setHearings] = useState<ClientHearing[]>([]);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [casesRes, hearingsRes, paymentsRes] = await Promise.all([
          fetch("/api/client/cases", { method: "GET", cache: "no-store" }),
          fetch("/api/client/hearings", { method: "GET", cache: "no-store" }),
          fetch("/api/client/payments", { method: "GET", cache: "no-store" }),
        ]);

        if (!casesRes.ok || !hearingsRes.ok || !paymentsRes.ok) {
          if ([casesRes.status, hearingsRes.status, paymentsRes.status].includes(401)) {
            throw new Error("Please sign in to continue.");
          }
          if ([casesRes.status, hearingsRes.status, paymentsRes.status].includes(403)) {
            throw new Error("You do not have access to the client portal.");
          }
          throw new Error("Could not load dashboard data.");
        }

        const [casesJson, hearingsJson, paymentsJson] = (await Promise.all([
          casesRes.json(),
          hearingsRes.json(),
          paymentsRes.json(),
        ])) as [ApiResponse<ClientCase>, ApiResponse<ClientHearing>, ApiResponse<ClientPayment>];

        if (!mounted) return;
        setCases(casesJson.data ?? []);
        setHearings(hearingsJson.data ?? []);
        setPayments(paymentsJson.data ?? []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const nextUpcomingHearing = useMemo(() => {
    const now = Date.now();
    return hearings
      .filter((hearing) => new Date(hearing.scheduled_at).getTime() >= now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null;
  }, [hearings]);

  const hearingHistory = useMemo(
    () => hearings.filter((hearing) => !nextUpcomingHearing || hearing.id !== nextUpcomingHearing.id),
    [hearings, nextUpcomingHearing],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Client Dashboard</h1>
        <p className="text-sm text-muted-foreground">Read-only overview of your cases, hearings, and payments.</p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading dashboard...</p> : null}
      {error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Next Upcoming Hearing</CardTitle>
              <CardDescription>Nearest scheduled hearing for your cases.</CardDescription>
            </CardHeader>
            <CardContent>
              {nextUpcomingHearing ? (
                <div className="flex flex-col gap-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{formatDate(nextUpcomingHearing.scheduled_at)}</p>
                    <Badge variant="secondary">{nextUpcomingHearing.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Location: {nextUpcomingHearing.location || "-"}</p>
                  <p className="text-sm text-muted-foreground">Judge: {nextUpcomingHearing.judge || "-"}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming hearing found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cases</CardTitle>
              <CardDescription>All cases linked to your client profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Court</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No cases found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cases.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell>{caseItem.case_number}</TableCell>
                        <TableCell>{caseItem.title}</TableCell>
                        <TableCell>{caseItem.status}</TableCell>
                        <TableCell>{caseItem.court_name || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hearing History</CardTitle>
              <CardDescription>Past and other hearing records for your cases.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Judge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hearingHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No hearing history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    hearingHistory.map((hearing) => (
                      <TableRow key={hearing.id}>
                        <TableCell>{formatDate(hearing.scheduled_at)}</TableCell>
                        <TableCell>{hearing.status}</TableCell>
                        <TableCell>{hearing.location || "-"}</TableCell>
                        <TableCell>{hearing.judge || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Invoice and payment records for your cases.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No payment history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.invoice_number}</TableCell>
                        <TableCell>{payment.status}</TableCell>
                        <TableCell>{formatDate(payment.issue_date)}</TableCell>
                        <TableCell>{formatDate(payment.paid_at)}</TableCell>
                        <TableCell>{formatCurrency(payment.total_amount, payment.billing_currency)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount_paid, payment.billing_currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
