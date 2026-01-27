export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          firm_id: string
          hearing_id: string | null
          id: string
          matter_id: string | null
          notified_users: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          firm_id: string
          hearing_id?: string | null
          id?: string
          matter_id?: string | null
          notified_users?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          firm_id?: string
          hearing_id?: string | null
          id?: string
          matter_id?: string | null
          notified_users?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_hearing_id_fkey"
            columns: ["hearing_id"]
            isOneToOne: false
            referencedRelation: "hearings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      case_histories: {
        Row: {
          case_number: string | null
          court_name: string | null
          created_at: string
          date: string
          details: string
          firm_id: string
          hearing_date: string | null
          id: string
          matter_id: string
          next_hearing_reason: string | null
          stage: string | null
          updated_by: string | null
        }
        Insert: {
          case_number?: string | null
          court_name?: string | null
          created_at?: string
          date: string
          details: string
          firm_id: string
          hearing_date?: string | null
          id?: string
          matter_id: string
          next_hearing_reason?: string | null
          stage?: string | null
          updated_by?: string | null
        }
        Update: {
          case_number?: string | null
          court_name?: string | null
          created_at?: string
          date?: string
          details?: string
          firm_id?: string
          hearing_date?: string | null
          id?: string
          matter_id?: string
          next_hearing_reason?: string | null
          stage?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_histories_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_histories_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_histories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          case_type: string | null
          client_id: string | null
          closing_date: string | null
          court_name: string | null
          created_at: string
          description: string | null
          filing_date: string | null
          firm_id: string
          id: string
          jurisdiction: string | null
          lead_counsel_id: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
        }
        Insert: {
          case_number: string
          case_type?: string | null
          client_id?: string | null
          closing_date?: string | null
          court_name?: string | null
          created_at?: string
          description?: string | null
          filing_date?: string | null
          firm_id: string
          id?: string
          jurisdiction?: string | null
          lead_counsel_id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
        }
        Update: {
          case_number?: string
          case_type?: string | null
          client_id?: string | null
          closing_date?: string | null
          court_name?: string | null
          created_at?: string
          description?: string | null
          filing_date?: string | null
          firm_id?: string
          id?: string
          jurisdiction?: string | null
          lead_counsel_id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_lead_counsel_id_fkey"
            columns: ["lead_counsel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          cnic: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          firm_id: string
          full_name: string
          id: string
          notes: string | null
          organization_name: string | null
          phone: string | null
          province: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnic?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          firm_id: string
          full_name: string
          id?: string
          notes?: string | null
          organization_name?: string | null
          phone?: string | null
          province?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnic?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          firm_id?: string
          full_name?: string
          id?: string
          notes?: string | null
          organization_name?: string | null
          phone?: string | null
          province?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_extracted_entities: Json | null
          ai_processed: boolean | null
          ai_processed_at: string | null
          ai_processing_status: string | null
          ai_summary: string | null
          case_id: string | null
          created_at: string
          file_name: string
          firm_id: string
          id: string
          is_archived: boolean
          matter_id: string | null
          metadata: Json | null
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          ai_extracted_entities?: Json | null
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          case_id?: string | null
          created_at?: string
          file_name: string
          firm_id: string
          id?: string
          is_archived?: boolean
          matter_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          ai_extracted_entities?: Json | null
          ai_processed?: boolean | null
          ai_processed_at?: string | null
          ai_processing_status?: string | null
          ai_summary?: string | null
          case_id?: string | null
          created_at?: string
          file_name?: string
          firm_id?: string
          id?: string
          is_archived?: boolean
          matter_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finances: {
        Row: {
          fee_paid: number
          fee_pending: number | null
          fee_total: number
          firm_id: string
          id: string
          matter_id: string
          payment_history: Json | null
          updated_at: string
        }
        Insert: {
          fee_paid?: number
          fee_pending?: number | null
          fee_total?: number
          firm_id: string
          id?: string
          matter_id: string
          payment_history?: Json | null
          updated_at?: string
        }
        Update: {
          fee_paid?: number
          fee_pending?: number | null
          fee_total?: number
          firm_id?: string
          id?: string
          matter_id?: string
          payment_history?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finances_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finances_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string | null
          firm_id: string
          id: string
          invited_by: string | null
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          firm_id: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          firm_id?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_invitations_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          locale: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          subscription_status: string | null
          subscription_plan_id: string | null
          trial_started_at: string | null
          trial_ends_at: string | null
          subscription_started_at: string | null
          subscription_ends_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          locale?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          subscription_status?: string | null
          subscription_plan_id?: string | null
          trial_started_at?: string | null
          trial_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_ends_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          locale?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          subscription_status?: string | null
          subscription_plan_id?: string | null
          trial_started_at?: string | null
          trial_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_ends_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hearings: {
        Row: {
          case_id: string | null
          created_at: string
          duration_minutes: number | null
          firm_id: string
          id: string
          judge: string | null
          location: string | null
          matter_id: string | null
          notes: string | null
          reminder_channel: string[] | null
          reminder_sent_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["hearing_status"]
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          firm_id: string
          id?: string
          judge?: string | null
          location?: string | null
          matter_id?: string | null
          notes?: string | null
          reminder_channel?: string[] | null
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["hearing_status"]
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          firm_id?: string
          id?: string
          judge?: string | null
          location?: string | null
          matter_id?: string | null
          notes?: string | null
          reminder_channel?: string[] | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["hearing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hearings_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hearings_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          billing_currency: string
          case_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          discount_amount: number
          due_date: string | null
          firm_id: string
          id: string
          invoice_number: string
          issue_date: string
          matter_id: string | null
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          billing_currency?: string
          case_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          firm_id: string
          id?: string
          invoice_number: string
          issue_date?: string
          matter_id?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          billing_currency?: string
          case_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          firm_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          matter_id?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_serial_counters: {
        Row: {
          firm_id: string
          last_sequence: number
          matter_type: Database["public"]["Enums"]["matter_type"]
        }
        Insert: {
          firm_id: string
          last_sequence?: number
          matter_type: Database["public"]["Enums"]["matter_type"]
        }
        Update: {
          firm_id?: string
          last_sequence?: number
          matter_type?: Database["public"]["Enums"]["matter_type"]
        }
        Relationships: [
          {
            foreignKeyName: "matter_serial_counters_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      matters: {
        Row: {
          against_parties: Json | null
          assigned_attorneys: string[] | null
          case_file_date: string | null
          case_number: string | null
          case_type: Database["public"]["Enums"]["matter_case_type"] | null
          client_brief: string | null
          client_id: string
          court_name: string | null
          created_at: string
          created_by: string | null
          district: string | null
          documents_provided: string[] | null
          evidence_provided: string[] | null
          firm_id: string
          id: string
          matter_status: Database["public"]["Enums"]["matter_status"]
          matter_type: Database["public"]["Enums"]["matter_type"]
          metadata: Json | null
          pending_documents: string[] | null
          serial_number: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          against_parties?: Json | null
          assigned_attorneys?: string[] | null
          case_file_date?: string | null
          case_number?: string | null
          case_type?: Database["public"]["Enums"]["matter_case_type"] | null
          client_brief?: string | null
          client_id: string
          court_name?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          documents_provided?: string[] | null
          evidence_provided?: string[] | null
          firm_id: string
          id?: string
          matter_status?: Database["public"]["Enums"]["matter_status"]
          matter_type: Database["public"]["Enums"]["matter_type"]
          metadata?: Json | null
          pending_documents?: string[] | null
          serial_number: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          against_parties?: Json | null
          assigned_attorneys?: string[] | null
          case_file_date?: string | null
          case_number?: string | null
          case_type?: Database["public"]["Enums"]["matter_case_type"] | null
          client_brief?: string | null
          client_id?: string
          court_name?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          documents_provided?: string[] | null
          evidence_provided?: string[] | null
          firm_id?: string
          id?: string
          matter_status?: Database["public"]["Enums"]["matter_status"]
          matter_type?: Database["public"]["Enums"]["matter_type"]
          metadata?: Json | null
          pending_documents?: string[] | null
          serial_number?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          announcement_updates: boolean
          created_at: string
          hearing_reminders: boolean
          invoice_reminders: boolean
          profile_id: string
          updated_at: string
        }
        Insert: {
          announcement_updates?: boolean
          created_at?: string
          hearing_reminders?: boolean
          invoice_reminders?: boolean
          profile_id: string
          updated_at?: string
        }
        Update: {
          announcement_updates?: boolean
          created_at?: string
          hearing_reminders?: boolean
          invoice_reminders?: boolean
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          firm_id: string
          id: string
          link: string | null
          message: string | null
          read_at: string | null
          related_entity: string | null
          related_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          firm_id: string
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          related_entity?: string | null
          related_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          firm_id?: string
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          related_entity?: string | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          firm_id: string | null
          full_name: string | null
          id: string
          is_active: boolean
          language_preference: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          firm_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          language_preference?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          firm_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          language_preference?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          assigned_courts: string[] | null
          assigned_districts: string[] | null
          created_at: string
          firm_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_courts?: string[] | null
          assigned_districts?: string[] | null
          created_at?: string
          firm_id: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_courts?: string[] | null
          assigned_districts?: string[] | null
          created_at?: string
          firm_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          amount: number | null
          billable: boolean
          billing_rate: number | null
          case_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          firm_id: string
          id: string
          invoice_id: string | null
          matter_id: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          billable?: boolean
          billing_rate?: number | null
          case_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          firm_id: string
          id?: string
          invoice_id?: string | null
          matter_id?: string | null
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          billable?: boolean
          billing_rate?: number | null
          case_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          firm_id?: string
          id?: string
          invoice_id?: string | null
          matter_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          firm_id: string
          sender_id: string
          recipient_id: string | null
          content: string
          is_read: boolean
          read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          sender_id: string
          recipient_id?: string | null
          content: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          sender_id?: string
          recipient_id?: string | null
          content?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          price_monthly: number
          price_id_stripe: string | null
          product_id_stripe: string | null
          features: unknown
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price_monthly: number
          price_id_stripe?: string | null
          product_id_stripe?: string | null
          features?: unknown
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price_monthly?: number
          price_id_stripe?: string | null
          product_id_stripe?: string | null
          features?: unknown
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_matter_serial: {
        Args: {
          p_firm_id: string
          p_matter_type: Database["public"]["Enums"]["matter_type"]
        }
        Returns: string
      }
      is_member_of_firm: { Args: { target_firm: string }; Returns: boolean }
    }
    Enums: {
      calendar_event_type:
        | "hearing"
        | "follow_up"
        | "execution"
        | "appeal"
        | "deadline"
      case_status: "pending" | "active" | "closed" | "archived"
      client_representation: "self" | "representative"
      client_type: "individual" | "organization"
      hearing_status: "scheduled" | "adjourned" | "completed" | "cancelled"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void"
      matter_case_type: "civil" | "criminal" | "corporate"
      matter_party_type: "individual" | "organization" | "state"
      matter_status:
        | "fresh diary"
        | "pending"
        | "execution"
        | "revision"
        | "review"
        | "appeal"
      matter_type: "advisory" | "litigation" | "mediation"
      representative_capacity: "third_party" | "corporate" | "government_dept"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      calendar_event_type: [
        "hearing",
        "follow_up",
        "execution",
        "appeal",
        "deadline",
      ],
      case_status: ["pending", "active", "closed", "archived"],
      client_representation: ["self", "representative"],
      client_type: ["individual", "organization"],
      hearing_status: ["scheduled", "adjourned", "completed", "cancelled"],
      invoice_status: ["draft", "sent", "paid", "overdue", "void"],
      matter_case_type: ["civil", "criminal", "corporate"],
      matter_party_type: ["individual", "organization", "state"],
      matter_status: [
        "fresh diary",
        "pending",
        "execution",
        "revision",
        "review",
        "appeal",
      ],
      matter_type: ["advisory", "litigation", "mediation"],
      representative_capacity: ["third_party", "corporate", "government_dept"],
    },
  },
} as const
