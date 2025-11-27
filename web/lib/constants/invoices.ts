export const invoiceStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "void", label: "Void" },
] as const;

export type InvoiceStatusOption = (typeof invoiceStatusOptions)[number]["value"];

