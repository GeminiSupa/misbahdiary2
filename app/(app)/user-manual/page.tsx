import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookOpen, Users, Briefcase, Calendar, Banknote, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "User Manual • Lawyer Diary",
};

export default async function UserManualPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  // Allow access to user manual even if no firm_id (for new users)
  // This page is accessible to all authenticated users

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">User Manual</h1>
          <p className="text-muted-foreground">Complete guide to using Lawyer Diary</p>
        </div>
      </div>

      <Tabs defaultValue="english" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="english">English</TabsTrigger>
          <TabsTrigger value="urdu">اردو</TabsTrigger>
        </TabsList>

        {/* English Content */}
        <TabsContent value="english" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Follow these steps to start using Lawyer Diary effectively
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                    1
                  </Badge>
                  <div>
                    <h3 className="font-semibold mb-1">Sign Up / Sign In</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your account or sign in to access Lawyer Diary. You'll get a 30-day free trial to explore all features.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                    2
                  </Badge>
                  <div>
                    <h3 className="font-semibold mb-1">Complete Onboarding</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up your firm details, including name, contact information, and address. This information will be used in your documents and invoices.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Step 1: Add Clients First
              </CardTitle>
              <CardDescription>
                Clients are the foundation of your practice. Add them before creating cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Navigate to Clients</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on <strong>"Clients"</strong> in the sidebar (located right after Dashboard).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Add New Client</h3>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">Click the <strong>"Add Client"</strong> button. You can add:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                        <li>Individual clients (with full name, father's name, CNIC, contact details)</li>
                        <li>Organization clients (with organization name, representative details)</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Fill Client Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter all required details including name, email, phone, address, and any notes. This information will be automatically used when creating cases and invoices.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Save Client</h3>
                    <p className="text-sm text-muted-foreground">
                      Once saved, the client will appear in your clients list and can be selected when creating cases.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Step 2: Create Cases (Matters)
              </CardTitle>
              <CardDescription>
                After adding clients, create cases to track your legal matters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Navigate to Cases</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on <strong>"Cases"</strong> (or "Matters") in the sidebar.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Create New Case</h3>
                    <p className="text-sm text-muted-foreground">
                      Click <strong>"New Matter"</strong> button. Select a client from the dropdown (clients you added in Step 1).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Enter Case Details</h3>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">Fill in:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                        <li>Case type (Civil, Criminal, Family, Corporate, etc.)</li>
                        <li>Case number (if available)</li>
                        <li>Court name and location</li>
                        <li>Case status (Active, Closed, Pending, etc.)</li>
                        <li>Description and notes</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Assign Team Members</h3>
                    <p className="text-sm text-muted-foreground">
                      If you have team members, assign them to the case. They'll be able to view and work on the case.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Step 3: Manage Calendar & Hearings
              </CardTitle>
              <CardDescription>
                Schedule and track court hearings and important dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Navigate to Calendar</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on <strong>"Calendar"</strong> in the sidebar to view all scheduled hearings.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Add New Hearing</h3>
                    <p className="text-sm text-muted-foreground">
                      Click <strong>"New Hearing"</strong> to schedule a court date. Link it to a case, set date/time, duration, and location.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">View Timeline</h3>
                    <p className="text-sm text-muted-foreground">
                      The calendar shows upcoming hearings in a timeline view. You can filter by date range and see all scheduled events.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                Step 4: Manage Billing & Invoices
              </CardTitle>
              <CardDescription>
                Create invoices, track payments, and manage billing for your cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Navigate to Billing</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on <strong>"Billing"</strong> in the sidebar to access invoice management.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Create Invoice</h3>
                    <p className="text-sm text-muted-foreground">
                      Click <strong>"New Invoice"</strong>. Select a client and case, add line items (services, fees), set due date, and generate the invoice.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Track Payments</h3>
                    <p className="text-sm text-muted-foreground">
                      Mark invoices as paid, view payment history, and see aging reports to track outstanding payments.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Export PDF</h3>
                    <p className="text-sm text-muted-foreground">
                      Download invoices as PDFs to send to clients or for record-keeping.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    View KPIs, recent activity, case statistics, and quick access to important information.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Client Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Store complete client information, contact details, and notes. Export client profiles as PDF.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Case Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize cases by status, type, and court. Assign team members and track case progress.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Time Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track time spent on cases and activities for accurate billing.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Document Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload and organize documents related to cases and clients.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground">
                    Invite team members, assign roles, and collaborate on cases together.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Urdu Content */}
        <TabsContent value="urdu" className="space-y-6 mt-6" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                شروع کرنا
              </CardTitle>
              <CardDescription>
                Lawyer Diary استعمال کرنے کے لیے ان مراحل پر عمل کریں
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                    1
                  </Badge>
                  <div>
                    <h3 className="font-semibold mb-1">سائن اپ / سائن ان</h3>
                    <p className="text-sm text-muted-foreground">
                      اپنا اکاؤنٹ بنائیں یا Lawyer Diary تک رسائی کے لیے سائن ان کریں۔ آپ کو تمام خصوصیات کو دریافت کرنے کے لیے 30 دن کی مفت آزمائش ملے گی۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                    2
                  </Badge>
                  <div>
                    <h3 className="font-semibold mb-1">آن بورڈنگ مکمل کریں</h3>
                    <p className="text-sm text-muted-foreground">
                      اپنی فرم کی تفصیلات مرتب کریں، بشمول نام، رابطے کی معلومات، اور پتہ۔ یہ معلومات آپ کے دستاویزات اور انوائسز میں استعمال ہوگی۔
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                مرحلہ 1: پہلے کلائنٹ شامل کریں
              </CardTitle>
              <CardDescription>
                کلائنٹ آپ کے پریکٹس کی بنیاد ہیں۔ کیس بنانے سے پہلے انہیں شامل کریں۔
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">کلائنٹ پر جائیں</h3>
                    <p className="text-sm text-muted-foreground">
                      سائیڈبار میں <strong>"Clients"</strong> پر کلک کریں (Dashboard کے فوراً بعد)۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">نیا کلائنٹ شامل کریں</h3>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2"><strong>"Add Client"</strong> بٹن پر کلک کریں۔ آپ شامل کر سکتے ہیں:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4" dir="rtl">
                        <li>انفرادی کلائنٹ (مکمل نام، والد کا نام، شناختی کارڈ، رابطے کی تفصیلات کے ساتھ)</li>
                        <li>تنظیمی کلائنٹ (تنظیم کا نام، نمائندے کی تفصیلات کے ساتھ)</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">کلائنٹ کی معلومات بھریں</h3>
                    <p className="text-sm text-muted-foreground">
                      تمام ضروری تفصیلات درج کریں بشمول نام، ای میل، فون، پتہ، اور کوئی نوٹس۔ یہ معلومات کیس اور انوائسز بناتے وقت خود بخود استعمال ہوگی۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">کلائنٹ محفوظ کریں</h3>
                    <p className="text-sm text-muted-foreground">
                      ایک بار محفوظ ہونے کے بعد، کلائنٹ آپ کی کلائنٹس کی فہرست میں ظاہر ہوگا اور کیس بناتے وقت منتخب کیا جا سکتا ہے۔
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                مرحلہ 2: کیس (معاملات) بنائیں
              </CardTitle>
              <CardDescription>
                کلائنٹ شامل کرنے کے بعد، اپنے قانونی معاملات کو ٹریک کرنے کے لیے کیس بنائیں۔
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">کیسز پر جائیں</h3>
                    <p className="text-sm text-muted-foreground">
                      سائیڈبار میں <strong>"Cases"</strong> (یا "Matters") پر کلک کریں۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">نیا کیس بنائیں</h3>
                    <p className="text-sm text-muted-foreground">
                      <strong>"New Matter"</strong> بٹن پر کلک کریں۔ ڈراپ ڈاؤن سے ایک کلائنٹ منتخب کریں (مرحلہ 1 میں آپ نے جو کلائنٹ شامل کیے)۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">کیس کی تفصیلات درج کریں</h3>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">بھریں:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4" dir="rtl">
                        <li>کیس کی قسم (سول، فوجداری، خاندانی، کارپوریٹ، وغیرہ)</li>
                        <li>کیس نمبر (اگر دستیاب ہو)</li>
                        <li>عدالت کا نام اور مقام</li>
                        <li>کیس کی حیثیت (فعال، بند، زیر التواء، وغیرہ)</li>
                        <li>تفصیلات اور نوٹس</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">ٹیم ممبران تفویض کریں</h3>
                    <p className="text-sm text-muted-foreground">
                      اگر آپ کے پاس ٹیم ممبران ہیں، تو انہیں کیس تفویض کریں۔ وہ کیس دیکھ اور اس پر کام کر سکیں گے۔
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                مرحلہ 3: کیلنڈر اور سماعتیں منظم کریں
              </CardTitle>
              <CardDescription>
                عدالتی سماعتیں اور اہم تاریخوں کو شیڈول اور ٹریک کریں۔
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">کیلنڈر پر جائیں</h3>
                    <p className="text-sm text-muted-foreground">
                      تمام شیڈول شدہ سماعتیں دیکھنے کے لیے سائیڈبار میں <strong>"Calendar"</strong> پر کلک کریں۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">نیا سماعت شامل کریں</h3>
                    <p className="text-sm text-muted-foreground">
                      عدالت کی تاریخ شیڈول کرنے کے لیے <strong>"New Hearing"</strong> پر کلک کریں۔ اسے ایک کیس سے منسلک کریں، تاریخ/وقت، مدت، اور مقام مقرر کریں۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">ٹائم لائن دیکھیں</h3>
                    <p className="text-sm text-muted-foreground">
                      کیلنڈر ٹائم لائن ویو میں آنے والی سماعتیں دکھاتا ہے۔ آپ تاریخ کی حد سے فلٹر کر سکتے ہیں اور تمام شیڈول شدہ واقعات دیکھ سکتے ہیں۔
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                مرحلہ 4: بِلنگ اور انوائسز منظم کریں
              </CardTitle>
              <CardDescription>
                انوائسز بنائیں، ادائیگیوں کو ٹریک کریں، اور اپنے کیسز کے لیے بِلنگ منظم کریں۔
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">بِلنگ پر جائیں</h3>
                    <p className="text-sm text-muted-foreground">
                      انوائس مینجمنٹ تک رسائی کے لیے سائیڈبار میں <strong>"Billing"</strong> پر کلک کریں۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">انوائس بنائیں</h3>
                    <p className="text-sm text-muted-foreground">
                      <strong>"New Invoice"</strong> پر کلک کریں۔ ایک کلائنٹ اور کیس منتخب کریں، لائن آئٹمز (خدمات، فیس) شامل کریں، واجب الادا تاریخ مقرر کریں، اور انوائس تیار کریں۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">ادائیگیوں کو ٹریک کریں</h3>
                    <p className="text-sm text-muted-foreground">
                      انوائسز کو ادا شدہ نشان زد کریں، ادائیگی کی تاریخ دیکھیں، اور بے باقی ادائیگیوں کو ٹریک کرنے کے لیے ایجنگ رپورٹس دیکھیں۔
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <h3 className="font-semibold mb-1">PDF ایکسپورٹ کریں</h3>
                    <p className="text-sm text-muted-foreground">
                      کلائنٹس کو بھیجنے یا ریکارڈ رکھنے کے لیے انوائسز کو PDFs کے طور پر ڈاؤن لوڈ کریں۔
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اہم خصوصیات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">ڈیش بورڈ</h3>
                  <p className="text-sm text-muted-foreground">
                    KPIs، حالیہ سرگرمی، کیس کے اعداد و شمار، اور اہم معلومات تک فوری رسائی دیکھیں۔
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">کلائنٹ مینجمنٹ</h3>
                  <p className="text-sm text-muted-foreground">
                    مکمل کلائنٹ کی معلومات، رابطے کی تفصیلات، اور نوٹس محفوظ کریں۔ کلائنٹ پروفائلز کو PDF کے طور پر ایکسپورٹ کریں۔
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">کیس ٹریکنگ</h3>
                  <p className="text-sm text-muted-foreground">
                    حیثیت، قسم، اور عدالت کے لحاظ سے کیسز کو منظم کریں۔ ٹیم ممبران تفویض کریں اور کیس کی پیشرفت کو ٹریک کریں۔
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">وقت ٹریکنگ</h3>
                  <p className="text-sm text-muted-foreground">
                    درست بِلنگ کے لیے کیسز اور سرگرمیوں پر گزارے گئے وقت کو ٹریک کریں۔
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">دستاویز مینجمنٹ</h3>
                  <p className="text-sm text-muted-foreground">
                    کیسز اور کلائنٹس سے متعلق دستاویزات اپ لوڈ اور منظم کریں۔
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">ٹیم تعاون</h3>
                  <p className="text-sm text-muted-foreground">
                    ٹیم ممبران کو مدعو کریں، کردار تفویض کریں، اور مل کر کیسز پر کام کریں۔
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
