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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          affects_balance: boolean | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          currency: string
          description: string
          employee_id: string
          id: string
          receipt_url: string | null
          rejection_reason: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          affects_balance?: boolean | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          currency?: string
          description: string
          employee_id: string
          id?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          affects_balance?: boolean | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string
          employee_id?: string
          id?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      document_comments: {
        Row: {
          comment: string
          comment_type: string
          created_at: string | null
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          comment: string
          comment_type: string
          created_at?: string | null
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          comment?: string
          comment_type?: string
          created_at?: string | null
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_storage"
            referencedColumns: ["id"]
          },
        ]
      }
      document_storage: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cash_transaction_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number
          id: string
          is_latest_version: boolean | null
          mime_type: string | null
          rejection_reason: string | null
          replacement_reason: string | null
          replacement_status: string | null
          replaces_document_id: string | null
          source: string
          updated_at: string | null
          uploaded_by: string
          user_id: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cash_transaction_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number
          id?: string
          is_latest_version?: boolean | null
          mime_type?: string | null
          rejection_reason?: string | null
          replacement_reason?: string | null
          replacement_status?: string | null
          replaces_document_id?: string | null
          source: string
          updated_at?: string | null
          uploaded_by: string
          user_id: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cash_transaction_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number
          id?: string
          is_latest_version?: boolean | null
          mime_type?: string | null
          rejection_reason?: string | null
          replacement_reason?: string | null
          replacement_status?: string | null
          replaces_document_id?: string | null
          source?: string
          updated_at?: string | null
          uploaded_by?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_storage_cash_transaction_id_fkey"
            columns: ["cash_transaction_id"]
            isOneToOne: false
            referencedRelation: "cash_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_storage_replaces_document_id_fkey"
            columns: ["replaces_document_id"]
            isOneToOne: false
            referencedRelation: "document_storage"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          invitation_code: string
          organization_id: string
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          id?: string
          invitation_code?: string
          organization_id: string
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          invitation_code?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "employee_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_recurring_allowances: {
        Row: {
          allowance_type: string
          amount: number
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allowance_type: string
          amount: number
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allowance_type?: string
          amount?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_recurring_allowances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employee_work_schedules: {
        Row: {
          created_at: string
          friday: boolean
          id: string
          monday: boolean
          saturday: boolean
          sunday: boolean
          thursday: boolean
          tuesday: boolean
          updated_at: string
          user_id: string
          wednesday: boolean
        }
        Insert: {
          created_at?: string
          friday?: boolean
          id?: string
          monday?: boolean
          saturday?: boolean
          sunday?: boolean
          thursday?: boolean
          tuesday?: boolean
          updated_at?: string
          user_id: string
          wednesday?: boolean
        }
        Update: {
          created_at?: string
          friday?: boolean
          id?: string
          monday?: boolean
          saturday?: boolean
          sunday?: boolean
          thursday?: boolean
          tuesday?: boolean
          updated_at?: string
          user_id?: string
          wednesday?: boolean
        }
        Relationships: []
      }
      leave_allocations: {
        Row: {
          administrator_approved_at: string | null
          administrator_approved_by: string | null
          allocated_by: string
          allocated_days: number
          created_at: string
          id: string
          leave_type_id: string
          senior_management_approved_at: string | null
          senior_management_approved_by: string | null
          status: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          administrator_approved_at?: string | null
          administrator_approved_by?: string | null
          allocated_by: string
          allocated_days?: number
          created_at?: string
          id?: string
          leave_type_id: string
          senior_management_approved_at?: string | null
          senior_management_approved_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          administrator_approved_at?: string | null
          administrator_approved_by?: string | null
          allocated_by?: string
          allocated_days?: number
          created_at?: string
          id?: string
          leave_type_id?: string
          senior_management_approved_at?: string | null
          senior_management_approved_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          created_at: string
          id: string
          leave_type_id: string
          remaining_days: number
          total_days: number
          updated_at: string
          used_days: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          leave_type_id: string
          remaining_days?: number
          total_days?: number
          updated_at?: string
          used_days?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          leave_type_id?: string
          remaining_days?: number
          total_days?: number
          updated_at?: string
          used_days?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_balances_leave_type_id"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_balances_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          administrator_approved_at: string | null
          administrator_approved_by: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_requested: number
          delegation_active: boolean | null
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          senior_management_approved_at: string | null
          senior_management_approved_by: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          administrator_approved_at?: string | null
          administrator_approved_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested: number
          delegation_active?: boolean | null
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          senior_management_approved_at?: string | null
          senior_management_approved_by?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          administrator_approved_at?: string | null
          administrator_approved_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested?: number
          delegation_active?: boolean | null
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          senior_management_approved_at?: string | null
          senior_management_approved_by?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_requests_approved_by"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_leave_requests_leave_type_id"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_requests_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_days_per_year: number
          name: string
          requires_approval: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_days_per_year?: number
          name: string
          requires_approval?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_days_per_year?: number
          name?: string
          requires_approval?: boolean
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          industry_type: string | null
          max_employees: number
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          owner_id: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry_type?: string | null
          max_employees?: number
          name: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          owner_id: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry_type?: string | null
          max_employees?: number
          name?: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          owner_id?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      payroll_line_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          item_type: string
          payroll_record_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          id?: string
          item_type: string
          payroll_record_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          item_type?: string
          payroll_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_line_items_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_notifications: {
        Row: {
          id: string
          message: string | null
          notification_type: string
          payroll_record_id: string
          read_at: string | null
          sent_at: string
          sent_to: string
        }
        Insert: {
          id?: string
          message?: string | null
          notification_type: string
          payroll_record_id: string
          read_at?: string | null
          sent_at?: string
          sent_to: string
        }
        Update: {
          id?: string
          message?: string | null
          notification_type?: string
          payroll_record_id?: string
          read_at?: string | null
          sent_at?: string
          sent_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_notifications_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_salary: number
          confirmed_by_employee: boolean | null
          created_at: string
          created_by: string
          currency: string
          dispute_reason: string | null
          dispute_resolution_notes: string | null
          dispute_resolved_at: string | null
          disputed_at: string | null
          disputed_by_employee: boolean | null
          employee_confirmed_at: string | null
          employee_notes: string | null
          gross_total: number
          id: string
          month: number
          net_total: number
          sent_to_employee_at: string | null
          status: string
          submitted_for_approval_at: string | null
          total_allowances: number
          total_bonuses: number
          total_deductions: number
          total_others: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number
          confirmed_by_employee?: boolean | null
          created_at?: string
          created_by: string
          currency?: string
          dispute_reason?: string | null
          dispute_resolution_notes?: string | null
          dispute_resolved_at?: string | null
          disputed_at?: string | null
          disputed_by_employee?: boolean | null
          employee_confirmed_at?: string | null
          employee_notes?: string | null
          gross_total?: number
          id?: string
          month: number
          net_total?: number
          sent_to_employee_at?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          total_allowances?: number
          total_bonuses?: number
          total_deductions?: number
          total_others?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number
          confirmed_by_employee?: boolean | null
          created_at?: string
          created_by?: string
          currency?: string
          dispute_reason?: string | null
          dispute_resolution_notes?: string | null
          dispute_resolved_at?: string | null
          disputed_at?: string | null
          disputed_by_employee?: boolean | null
          employee_confirmed_at?: string | null
          employee_notes?: string | null
          gross_total?: number
          id?: string
          month?: number
          net_total?: number
          sent_to_employee_at?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          total_allowances?: number
          total_bonuses?: number
          total_deductions?: number
          total_others?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_change_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          current_value: string | null
          field_name: string
          id: string
          new_value: string
          rejection_reason: string | null
          requested_by: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_value?: string | null
          field_name: string
          id?: string
          new_value: string
          rejection_reason?: string | null
          requested_by: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_value?: string | null
          field_name?: string
          id?: string
          new_value?: string
          rejection_reason?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          updated_at: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          base_monthly_salary: number | null
          cash_balance: number | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          first_name: string | null
          home_address: string | null
          id: string
          id_number: string | null
          initial_setup_completed_at: string | null
          is_employer: boolean | null
          last_name: string | null
          manager_id: string | null
          marital_status: string | null
          organization_id: string | null
          passport_number: string | null
          phone_number: string | null
          position: string | null
          profile_completed: boolean | null
          salary_currency: string | null
          updated_at: string
          user_id: string
          visa_number: string | null
        }
        Insert: {
          base_monthly_salary?: number | null
          cash_balance?: number | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          first_name?: string | null
          home_address?: string | null
          id?: string
          id_number?: string | null
          initial_setup_completed_at?: string | null
          is_employer?: boolean | null
          last_name?: string | null
          manager_id?: string | null
          marital_status?: string | null
          organization_id?: string | null
          passport_number?: string | null
          phone_number?: string | null
          position?: string | null
          profile_completed?: boolean | null
          salary_currency?: string | null
          updated_at?: string
          user_id: string
          visa_number?: string | null
        }
        Update: {
          base_monthly_salary?: number | null
          cash_balance?: number | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          first_name?: string | null
          home_address?: string | null
          id?: string
          id_number?: string | null
          initial_setup_completed_at?: string | null
          is_employer?: boolean | null
          last_name?: string | null
          manager_id?: string | null
          marital_status?: string | null
          organization_id?: string | null
          passport_number?: string | null
          phone_number?: string | null
          position?: string | null
          profile_completed?: boolean | null
          salary_currency?: string | null
          updated_at?: string
          user_id?: string
          visa_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_manager_id"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      public_holidays: {
        Row: {
          country_code: string
          created_at: string
          created_by: string
          date: string
          id: string
          is_recurring: boolean
          language_code: string | null
          name: string
          source_import_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          country_code?: string
          created_at?: string
          created_by: string
          date: string
          id?: string
          is_recurring?: boolean
          language_code?: string | null
          name: string
          source_import_id?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          is_recurring?: boolean
          language_code?: string | null
          name?: string
          source_import_id?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      subscription_pricing: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          max_employees: number
          min_employees: number
          monthly_price: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_employees: number
          min_employees: number
          monthly_price?: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_employees?: number
          min_employees?: number
          monthly_price?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          admin_acknowledged_at: string | null
          admin_acknowledged_by: string | null
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_acknowledged_at?: string | null
          admin_acknowledged_by?: string | null
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_acknowledged_at?: string | null
          admin_acknowledged_by?: string | null
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_replacement: {
        Args: { approval_note?: string; doc_id: string }
        Returns: undefined
      }
      get_document_versions: {
        Args: { original_doc_id: string }
        Returns: {
          approved_at: string
          approved_by: string
          created_at: string
          document_name: string
          file_path: string
          id: string
          rejection_reason: string
          replacement_reason: string
          replacement_status: string
          uploaded_by: string
          version: number
        }[]
      }
      get_overdue_payroll_confirmations: {
        Args: never
        Returns: {
          days_overdue: number
          employee_id: string
          employee_name: string
          month: number
          payroll_id: string
          year: number
        }[]
      }
      get_user_organization_ids: { Args: never; Returns: string[] }
      get_user_position: { Args: { target_user_id: string }; Returns: string }
      get_user_role: { Args: { user_id: string }; Returns: string }
      has_delegation_rights: { Args: { user_id: string }; Returns: boolean }
      is_administrator: { Args: { user_id: string }; Returns: boolean }
      is_hr_admin: { Args: { user_id: string }; Returns: boolean }
      is_management: { Args: { user_id: string }; Returns: boolean }
      is_organization_member: { Args: { org_id: string }; Returns: boolean }
      is_organization_owner: { Args: { org_id: string }; Returns: boolean }
      is_senior_management: { Args: { user_id: string }; Returns: boolean }
      is_senior_position: { Args: { user_id: string }; Returns: boolean }
      reject_replacement: {
        Args: { doc_id: string; reason: string }
        Returns: undefined
      }
      soft_delete_document: {
        Args: { deletion_reason?: string; doc_id: string }
        Returns: undefined
      }
      sync_all_profiles: { Args: never; Returns: string }
      sync_profile_from_auth: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "employee" | "hr_admin" | "administrator"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      organization_type: "individual" | "company"
      subscription_tier: "free" | "mini" | "sme" | "enterprise"
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
      app_role: ["employee", "hr_admin", "administrator"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      organization_type: ["individual", "company"],
      subscription_tier: ["free", "mini", "sme", "enterprise"],
    },
  },
} as const
