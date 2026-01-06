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
    paddingBottom: 16,
    borderBottom: "2 solid #2563eb",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 4,
    color: "#2563eb",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    border: "1 solid #D5E4F2",
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: "#0f172a",
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#64748b",
    width: "35%",
    fontWeight: 600,
  },
  value: {
    fontSize: 11,
    color: "#0f172a",
    width: "65%",
  },
  fullWidth: {
    width: "100%",
  },
  badge: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    padding: "4 8",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  notes: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#475569",
    marginTop: 4,
  },
  footer: {
    marginTop: 32,
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 12,
  },
  mattersList: {
    marginTop: 8,
  },
  matterItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    border: "1 solid #e2e8f0",
  },
});

export type ClientPdfPayload = {
  firmName: string;
  firmAddress?: string | null;
  clientName: string;
  clientType: string;
  organizationName?: string | null;
  fatherName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  cnic?: string | null;
  representation?: string | null;
  representativeDetails?: { to_whom?: string | null; capacity?: string | null } | null;
  notes?: string | null;
  matters?: Array<{
    serial_number: string;
    matter_status: string;
    matter_type: string;
    case_number?: string | null;
    court_name?: string | null;
    district?: string | null;
  }>;
  generatedAt: string;
};

export function ClientPdfDocument({
  firmName,
  firmAddress,
  clientName,
  clientType,
  organizationName,
  fatherName,
  email,
  phone,
  address,
  city,
  province,
  country,
  cnic,
  representation,
  representativeDetails,
  notes,
  matters,
  generatedAt,
}: ClientPdfPayload) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Client Profile</Text>
            <Text style={styles.subtitle}>{firmName}</Text>
            {firmAddress && <Text style={styles.subtitle}>{firmAddress}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={styles.badge}>
              <Text>{clientType}</Text>
            </View>
            <Text style={[styles.subtitle, { marginTop: 8 }]}>Generated: {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
          {organizationName && (
            <View style={styles.row}>
              <Text style={styles.label}>Organization</Text>
              <Text style={styles.value}>{organizationName}</Text>
            </View>
          )}
          {fatherName && (
            <View style={styles.row}>
              <Text style={styles.label}>Father / Guardian</Text>
              <Text style={styles.value}>{fatherName}</Text>
            </View>
          )}
          {cnic && (
            <View style={styles.row}>
              <Text style={styles.label}>CNIC / ID</Text>
              <Text style={styles.value}>{cnic}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          {email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{email}</Text>
            </View>
          )}
          {phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{phone}</Text>
            </View>
          )}
          {address && (
            <View style={[styles.row, styles.fullWidth]}>
              <Text style={styles.label}>Address</Text>
              <Text style={[styles.value, { width: "65%" }]}>{address}</Text>
            </View>
          )}
          {(city || province || country) && (
            <View style={styles.row}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>
                {[city, province, country].filter(Boolean).join(", ") || "Not specified"}
              </Text>
            </View>
          )}
        </View>

        {representation && representation !== "self" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Representation</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{representation}</Text>
            </View>
            {representativeDetails?.to_whom && (
              <View style={styles.row}>
                <Text style={styles.label}>Represents</Text>
                <Text style={styles.value}>{representativeDetails.to_whom}</Text>
              </View>
            )}
            {representativeDetails?.capacity && (
              <View style={styles.row}>
                <Text style={styles.label}>Capacity</Text>
                <Text style={styles.value}>{representativeDetails.capacity}</Text>
              </View>
            )}
          </View>
        )}

        {matters && matters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Matters ({matters.length})</Text>
            <View style={styles.mattersList}>
              {matters.map((matter, index) => (
                <View key={index} style={styles.matterItem}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Serial</Text>
                    <Text style={styles.value}>{matter.serial_number}</Text>
                  </View>
                  {matter.court_name && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Court</Text>
                      <Text style={styles.value}>{matter.court_name}</Text>
                    </View>
                  )}
                  {matter.case_number && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Case #</Text>
                      <Text style={styles.value}>{matter.case_number}</Text>
                    </View>
                  )}
                  <View style={styles.row}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={styles.value}>{matter.matter_status}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Type</Text>
                    <Text style={styles.value}>{matter.matter_type}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated by Lawyer Diary • {firmName} • {generatedAt}
        </Text>
      </Page>
    </Document>
  );
}

