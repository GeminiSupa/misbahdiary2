import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing environment variables. Please set:\n" +
      "  - NEXT_PUBLIC_SUPABASE_URL\n" +
      "  - SUPABASE_SERVICE_ROLE_KEY\n\n" +
      "You can find these in your Supabase dashboard under Project Settings → API",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = "case_files";

async function setupStorage() {
  console.log(`Setting up storage bucket: ${BUCKET_NAME}...`);

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError);
    process.exit(1);
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

  if (bucketExists) {
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists.`);
    return;
  }

  // Create the bucket
  const { data: bucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: false,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  });

  if (createError) {
    console.error(`❌ Failed to create bucket "${BUCKET_NAME}":`, createError.message);
    process.exit(1);
  }

  console.log(`✅ Successfully created bucket "${BUCKET_NAME}"`);

  // Set up RLS policies for the bucket
  console.log("\n⚠️  Note: You may need to set up Storage RLS policies in your Supabase dashboard:");
  console.log("   1. Go to Storage → Policies");
  console.log("   2. Create policies for the 'case_files' bucket");
  console.log("   3. Allow authenticated users to upload/read files");
}

setupStorage().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

