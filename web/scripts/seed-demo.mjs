import { randomUUID } from "node:crypto";
import { Client } from "pg";

const connectionString = process.env.SUPABASE_DB_URL;
const firmId = process.env.SUPABASE_FIRM_ID;
const userId = process.env.SUPABASE_USER_ID;

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL. Provide the database connection string.");
  process.exit(1);
}

if (!firmId) {
  console.error("Missing SUPABASE_FIRM_ID. Provide the target firm id to seed.");
  process.exit(1);
}

if (!userId) {
  console.error("Missing SUPABASE_USER_ID. Provide the user id to assign as lead counsel.");
  process.exit(1);
}

const SEED_TAG = "Seed:LawyerDiary";

const clientRows = [
  {
    key: "ahmed",
    type: "individual",
    full_name: "Muhammad Ahmed",
    email: "ahmed.client@example.com",
    phone: "+92 300 4567890",
    city: "Lahore",
    province: "Punjab",
    notes: `${SEED_TAG} – Prefers SMS reminders.`,
  },
  {
    key: "fatima",
    type: "individual",
    full_name: "Fatima Noor",
    email: "fatima.noor@example.com",
    phone: "+92 321 9876543",
    city: "Karachi",
    province: "Sindh",
    notes: `${SEED_TAG} – Focus on family law cases.`,
  },
  {
    key: "horizon",
    type: "organization",
    full_name: "Horizon Logistics Pvt Ltd",
    organization_name: "Horizon Logistics Pvt Ltd",
    email: "legal@horizonlogistics.pk",
    phone: "+92 51 1234567",
    city: "Islamabad",
    province: "Islamabad Capital Territory",
    notes: `${SEED_TAG} – Corporate retainers for regulatory compliance.`,
  },
];

const caseRows = [
  {
    case_number: "2025-CIV-001",
    title: "Ahmed vs. Crescent Housing",
    status: "active",
    case_type: "Property dispute",
    filing_date: "2025-01-12",
    court_name: "Lahore High Court",
    description: `${SEED_TAG} – Ongoing civil litigation.`,
    clientKey: "ahmed",
  },
  {
    case_number: "2025-FAM-004",
    title: "Fatima vs. Noor",
    status: "pending",
    case_type: "Family",
    filing_date: "2025-02-18",
    court_name: "Karachi Family Court",
    description: `${SEED_TAG} – Custody proceedings.`,
    clientKey: "fatima",
  },
  {
    case_number: "2025-COMP-012",
    title: "Horizon Logistics Compliance Review",
    status: "active",
    case_type: "Corporate",
    filing_date: "2025-03-02",
    court_name: "SECP Islamabad",
    description: `${SEED_TAG} – Regulatory audit assistance.`,
    clientKey: "horizon",
  },
];

const hearingRows = [
  {
    caseNumber: "2025-CIV-001",
    scheduled_at: "2025-03-20T09:30:00+05:00",
    duration_minutes: 90,
    location: "Courtroom 4, Lahore High Court",
    status: "scheduled",
    notes: `${SEED_TAG} – Evidence submission.`,
  },
  {
    caseNumber: "2025-FAM-004",
    scheduled_at: "2025-03-28T11:00:00+05:00",
    duration_minutes: 60,
    location: "Karachi Family Court, Chamber 2",
    status: "scheduled",
    notes: `${SEED_TAG} – Mediation session.`,
  },
];

async function main() {
  const db = new Client({ connectionString });
  await db.connect();

  try {
    await db.query("begin;");

    await db.query("delete from public.hearings where notes like $1", [`${SEED_TAG}%`]);
    await db.query("delete from public.calendar_events where description like $1", [`${SEED_TAG}%`]);
    await db.query(
      `delete from public.finances
         where firm_id = $1
           and matter_id in (
             select id from public.matters where firm_id = $1 and client_brief like $2
           )`,
      [firmId, `${SEED_TAG}%`],
    );
    await db.query(
      "delete from public.matters where firm_id = $1 and client_brief like $2",
      [firmId, `${SEED_TAG}%`],
    );
    await db.query("delete from public.clients where notes like $1", [`${SEED_TAG}%`]);

    const clientIds = {};

    for (const entry of clientRows) {
      const existing = await db.query(
        "select id from public.clients where firm_id = $1 and lower(full_name) = lower($2)",
        [firmId, entry.full_name],
      );

      if (existing.rowCount > 0) {
        clientIds[entry.key] = existing.rows[0].id;
        await db.query(
          `update public.clients
             set type = $2,
                 organization_name = $3,
                 email = $4,
                 phone = $5,
                 city = $6,
                 province = $7,
                 country = $8,
                 notes = $9
           where id = $1`,
          [
            clientIds[entry.key],
            entry.type,
            entry.organization_name ?? null,
            entry.email ?? null,
            entry.phone ?? null,
            entry.city ?? null,
            entry.province ?? null,
            "Pakistan",
            entry.notes ?? null,
          ],
        );
        continue;
      }

      const inserted = await db.query(
        `insert into public.clients
           (id, firm_id, type, full_name, organization_name, email, phone, city, province, country, notes, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         returning id`,
        [
          randomUUID(),
          firmId,
          entry.type,
          entry.full_name,
          entry.organization_name ?? null,
          entry.email ?? null,
          entry.phone ?? null,
          entry.city ?? null,
          entry.province ?? null,
          "Pakistan",
          entry.notes ?? null,
          userId,
        ],
      );
      clientIds[entry.key] = inserted.rows[0].id;
    }

    const matterIds = {};

    for (const entry of caseRows) {
      const serialNumber = entry.case_number;
      const matterType = entry.case_number.includes("COMP") ? "advisory" : "litigation";
      const matterStatus = entry.status === "pending" ? "pending" : "fresh diary";
      const caseType =
        matterType === "litigation"
          ? entry.case_number.includes("COMP")
            ? "corporate"
            : "civil"
          : null;
      const district = entry.court_name?.split(" ")[0] ?? "Islamabad";
      const clientId = clientIds[entry.clientKey] ?? null;
      const assignedAttorneys = [userId];

      const existing = await db.query(
        "select id from public.matters where firm_id = $1 and serial_number = $2",
        [firmId, serialNumber],
      );

      if (existing.rowCount > 0) {
        matterIds[serialNumber] = existing.rows[0].id;
        await db.query(
          `update public.matters
             set client_id = $2,
                 matter_type = $3,
                 matter_status = $4,
                 case_number = $5,
                 court_name = $6,
                 district = $7,
                 case_file_date = $8,
                 case_type = $9,
                 client_brief = $10,
                 assigned_attorneys = $11,
                 updated_at = timezone('utc', now())
           where id = $1`,
          [
            matterIds[serialNumber],
            clientId,
            matterType,
            matterStatus,
            entry.case_number,
            entry.court_name ?? null,
            district,
            entry.filing_date ?? null,
            caseType,
            entry.description ?? `${SEED_TAG} matter`,
            assignedAttorneys,
          ],
        );
      } else {
        const matterId = randomUUID();
        await db.query(
          `insert into public.matters
             (id, firm_id, client_id, serial_number, matter_type, matter_status, case_number, court_name, district, case_file_date, case_type, client_brief, assigned_attorneys, created_by, updated_by)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)`,
          [
            matterId,
            firmId,
            clientId,
            serialNumber,
            matterType,
            matterStatus,
            entry.case_number,
            entry.court_name ?? null,
            district,
            entry.filing_date ?? null,
            caseType,
            entry.description ?? `${SEED_TAG} matter`,
            assignedAttorneys,
            userId,
          ],
        );
        matterIds[serialNumber] = matterId;

        await db.query(
          `insert into public.finances (id, firm_id, matter_id, fee_total, fee_paid)
           values ($1, $2, $3, 0, 0)
           on conflict (matter_id) do nothing`,
          [randomUUID(), firmId, matterId],
        );
      }
    }

    for (const entry of hearingRows) {
      const matterId = matterIds[entry.caseNumber];
      if (!matterId) continue;
      const hearingId = randomUUID();
      await db.query(
        `insert into public.hearings
           (id, firm_id, matter_id, scheduled_at, duration_minutes, location, status, notes)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (id) do nothing`,
        [
          hearingId,
          firmId,
          matterId,
          entry.scheduled_at,
          entry.duration_minutes,
          entry.location,
          entry.status,
          entry.notes ?? `${SEED_TAG} hearing`,
        ],
      );

      await db.query(
        `insert into public.calendar_events
           (id, firm_id, matter_id, hearing_id, event_type, event_date, description, notified_users, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (hearing_id) do update
           set event_date = excluded.event_date,
               description = excluded.description,
               notified_users = excluded.notified_users`,
        [
          randomUUID(),
          firmId,
          matterId,
          hearingId,
          "hearing",
          entry.scheduled_at.slice(0, 10),
          `${SEED_TAG} hearing`,
          [userId],
          userId,
        ],
      );
    }

    await db.query("commit;");
    console.log("✅ Seed data inserted for firm:", firmId);
  } catch (error) {
    await db.query("rollback;");
    console.error("❌ Failed to seed data");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();

