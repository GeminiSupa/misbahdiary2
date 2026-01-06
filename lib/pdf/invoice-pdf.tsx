import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTd2W3lhd.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCZ3FwrK3iLTd2W3lhdVroo.woff", fontWeight: 600 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 11,
    padding: 32,
    color: "#073B4C",
    backgroundColor: "#F7F9FB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
  },
  block: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    border: "1 solid #D5E4F2",
    backgroundColor: "#FFFFFF",
  },
  label: {
    fontSize: 9,
    textTransform: "uppercase",
    marginBottom: 2,
    color: "#56738C",
  },
  value: {
    fontSize: 11,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  footer: {
    marginTop: 24,
    fontSize: 9,
    color: "#56738C",
    textAlign: "center",
  },
});

export type InvoicePdfPayload = {
  firmName: string;
  firmAddress?: string | null;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  notes?: string | null;
  matterReference?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  lineItems: Array<{
    label: string;
    amount: number;
  }>;
};

const currency = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function InvoicePdfDocument({
  firmName,
  firmAddress,
  invoiceNumber,
  issueDate,
  dueDate,
  clientName,
  clientEmail,
  clientPhone,
  notes,
  matterReference,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  amountPaid,
  lineItems,
}: InvoicePdfPayload) {
  const outstanding = Math.max(totalAmount - amountPaid, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 600 }}>Invoice</Text>
            <Text>{firmName}</Text>
            {firmAddress ? <Text>{firmAddress}</Text> : null}
          </View>
          <View>
            <Text style={{ textAlign: "right", fontSize: 12, fontWeight: 600 }}>#{invoiceNumber}</Text>
            <Text style={{ textAlign: "right" }}>Issued: {issueDate}</Text>
            {dueDate ? <Text style={{ textAlign: "right" }}>Due: {dueDate}</Text> : null}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Bill to</Text>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 600 }}>{clientName}</Text>
            {clientEmail ? <Text>{clientEmail}</Text> : null}
            {clientPhone ? <Text>{clientPhone}</Text> : null}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Summary</Text>
          {matterReference ? (
            <View style={[styles.row, { marginBottom: 8 }]}>
              <Text style={styles.label}>Matter</Text>
              <Text style={styles.value}>{matterReference}</Text>
            </View>
          ) : null}
          {lineItems.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.value}>{item.label}</Text>
              <Text style={styles.value}>{currency.format(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>{currency.format(subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tax</Text>
            <Text style={styles.value}>{currency.format(taxAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Discount</Text>
            <Text style={styles.value}>- {currency.format(discountAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <Text style={[styles.value, { fontWeight: 600 }]}>
              {currency.format(totalAmount)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Paid</Text>
            <Text style={styles.value}>{currency.format(amountPaid)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Outstanding</Text>
            <Text style={styles.value}>{currency.format(outstanding)}</Text>
          </View>
        </View>

        {notes ? (
          <View style={styles.block}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Generated by Lawyer Diary • {firmName} • Invoice #{invoiceNumber}
        </Text>
      </Page>
    </Document>
  );
}
