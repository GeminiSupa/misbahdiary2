import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, CheckCircle2, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewPaymentSheet } from "@/components/cases/new-payment-sheet";
import { FeeTotalSheet } from "@/components/cases/fee-total-sheet";
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
  matterId: string;
};

type PaymentHistoryEntry = {
  date?: string;
  amount?: number;
  method?: string;
  notes?: string;
};

export function MatterFinanceCard({ finance, matterId }: MatterFinanceCardProps) {
  const total = Number(finance?.fee_total ?? 0);
  const paid = Number(finance?.fee_paid ?? 0);
  const pending = Math.max(total - paid, 0);
  const updatedAt = finance?.updated_at ? format(new Date(finance.updated_at), "dd MMM yyyy") : null;

  const history = normaliseHistory(finance?.payment_history);

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-6">
        <div className="sap-card-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Matter Finances</h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Monitor contracted fees, receipts, and outstanding balances for this matter.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FeeTotalSheet matterId={matterId} currentTotal={total} currentPaid={paid} />
            <NewPaymentSheet matterId={matterId} currentTotal={total} currentPaid={paid} />
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:gap-4 sm:rounded-2xl sm:p-5">
          <SummaryRow icon={DollarSign} label="Fee Total" value={total} accent="total" />
          <SummaryRow icon={CheckCircle2} label="Collected" value={paid} accent="paid" />
          <SummaryRow
            icon={Clock}
            label="Pending"
            value={pending}
            accent={pending > 0 ? "pending" : total === 0 ? "total" : "paid"}
          />
          {updatedAt && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-primary/20">
              Updated {updatedAt}
            </p>
          )}
        </div>

        {total === 0 && (
          <div className="rounded-xl border-2 border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Fee Total Not Set
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-200">
                  Set the fee total first before recording payments. Click "Set Fee Total" above to get started.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Payment History</h3>
            </div>
            <Badge variant="outline" className="font-semibold">{history.length}</Badge>
          </div>
          {history.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-6 text-center">
              <DollarSign className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div
                  key={`${entry.date}-${index}`}
                  className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-background/80 to-background/60 px-4 py-3 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-base font-bold text-foreground">
                      PKR {Number(entry.amount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
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
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "total" | "paid" | "pending";
}) {
  const accentClass =
    accent === "paid"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "pending"
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", accentClass)} />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-base font-bold sm:text-lg", accentClass)}>
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
