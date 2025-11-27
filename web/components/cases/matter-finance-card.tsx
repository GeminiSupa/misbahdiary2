import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type MatterFinance = {
  fee_total: number | null;
  fee_paid: number | null;
  fee_pending: number | null;
  payment_history: unknown;
  updated_at: string;
};

type MatterFinanceCardProps = {
  finance: MatterFinance | null;
};

type PaymentHistoryEntry = {
  date?: string;
  amount?: number;
  method?: string;
  notes?: string;
};

export function MatterFinanceCard({ finance }: MatterFinanceCardProps) {
  const total = Number(finance?.fee_total ?? 0);
  const paid = Number(finance?.fee_paid ?? 0);
  const pending = Number(finance?.fee_pending ?? Math.max(total - paid, 0));
  const updatedAt = finance?.updated_at ? format(new Date(finance.updated_at), "dd MMM yyyy") : null;

  const history = normaliseHistory(finance?.payment_history);

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Matter finances</h2>
            <p className="text-sm text-muted-foreground">
              Monitor contracted fees, receipts, and outstanding balances for this matter.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled title="Payment capture coming soon">
            Record payment
          </Button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
          <SummaryRow label="Fee total" value={total} accent="total" />
          <SummaryRow label="Collected" value={paid} accent="paid" />
          <SummaryRow label="Pending" value={pending} accent={pending > 0 ? "pending" : "paid"} />
          {updatedAt ? <p className="text-xs text-muted-foreground">Updated {updatedAt}</p> : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Payment history</h3>
            <Badge variant="outline">{history.length}</Badge>
          </div>
          {history.length === 0 ? (
            <div className="sap-subtle">
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div key={`${entry.date}-${index}`} className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">PKR {(Number(entry.amount ?? 0)).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.date ? format(new Date(entry.date), "dd MMM yyyy") : "Date pending"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.method ? `Method: ${entry.method}` : "Recorded payment"}
                    {entry.notes ? ` • ${entry.notes}` : null}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "total" | "paid" | "pending";
}) {
  const accentClass =
    accent === "paid"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "pending"
        ? "text-destructive"
        : "text-primary";

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-base font-semibold ${accentClass}`.trim()}>
        PKR {Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}

function normaliseHistory(history: unknown): PaymentHistoryEntry[] {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => (typeof entry === "object" && entry !== null ? entry : null))
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .map((entry) => ({
      date: typeof entry.date === "string" ? entry.date : undefined,
      amount: typeof entry.amount === "number" ? entry.amount : Number(entry.amount ?? 0),
      method: typeof entry.method === "string" ? entry.method : undefined,
      notes: typeof entry.notes === "string" ? entry.notes : undefined,
    }));
}
