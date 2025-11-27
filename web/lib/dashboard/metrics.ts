type Numeric = number | string | null;

export type MonthlyDatum = {
  month: string;
  total: number;
  paid: number;
  outstanding: number;
};

export function buildMonthlySeries(
  invoices: Array<{
    issue_date: string | null;
    due_date: string | null;
    status: string;
    total_amount: Numeric;
    amount_paid: Numeric;
  }>,
  monthsBack = 6,
): MonthlyDatum[] {
  const now = new Date();
  const buckets: Record<string, MonthlyDatum> = {};

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    buckets[key] = {
      month: date.toLocaleDateString("en-PK", { month: "short", year: "numeric" }),
      total: 0,
      paid: 0,
      outstanding: 0,
    };
  }

  invoices.forEach((invoice) => {
    if (!invoice.issue_date) return;
    const date = new Date(invoice.issue_date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!buckets[key]) return;

    const total = Number(invoice.total_amount ?? 0) || 0;
    const paid = Number(invoice.amount_paid ?? 0) || 0;
    const outstanding = Math.max(total - paid, 0);

    buckets[key].total += total;
    if (invoice.status === "paid") {
      buckets[key].paid += total;
    } else {
      buckets[key].outstanding += outstanding;
    }
  });

  return Object.keys(buckets)
    .sort((a, b) => {
      const [ay, am] = a.split("-").map(Number);
      const [by, bm] = b.split("-").map(Number);
      return ay === by ? am - bm : ay - by;
    })
    .map((key) => buckets[key]);
}

export type AgingDatum = {
  label: string;
  amount: number;
};

export function buildAgingBuckets(
  invoices: Array<{
    status: string;
    due_date: string | null;
    total_amount: Numeric;
    amount_paid: Numeric;
  }>,
): AgingDatum[] {
  const buckets: AgingDatum[] = [
    { label: "0-7 days", amount: 0 },
    { label: "8-30 days", amount: 0 },
    { label: "31-60 days", amount: 0 },
    { label: "61+ days", amount: 0 },
  ];

  const today = new Date();

  invoices.forEach((invoice) => {
    if (!invoice.due_date || (invoice.status !== "sent" && invoice.status !== "overdue")) return;

    const due = new Date(invoice.due_date);
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const outstanding = Math.max(Number(invoice.total_amount ?? 0) - Number(invoice.amount_paid ?? 0), 0);

    if (diffDays <= 7) {
      buckets[0].amount += outstanding;
    } else if (diffDays <= 30) {
      buckets[1].amount += outstanding;
    } else if (diffDays <= 60) {
      buckets[2].amount += outstanding;
    } else {
      buckets[3].amount += outstanding;
    }
  });

  return buckets;
}
