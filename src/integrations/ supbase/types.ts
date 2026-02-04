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
      approval_levels: {
        Row: {
          approval_rule: string
          approved_at: string | null
          approved_by: string | null
          comment: string | null
          created_at: string
          event_id: string
          id: string
          level: number
          required_roles: Database["public"]["Enums"]["app_role"][]
          status: string
        }
        Insert: {
          approval_rule?: string
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          level: number
          required_roles: Database["public"]["Enums"]["app_role"][]
          status?: string
        }
        Update: {
          approval_rule?: string
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          level?: number
          required_roles?: Database["public"]["Enums"]["app_role"][]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_levels_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          reviewer_id: string
          stage: Database["public"]["Enums"]["approval_stage"]
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          reviewer_id: string
          stage: Database["public"]["Enums"]["approval_stage"]
          status: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          reviewer_id?: string
          stage?: Database["public"]["Enums"]["approval_stage"]
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "approvals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          checked_in_at: string
          event_id: string
          guest_label: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string
          event_id: string
          guest_label?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string
          event_id?: string
          guest_label?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blackout_dates: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string
          start_date: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason: string
          start_date: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          start_date?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blackout_dates_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          category: string | null
          club_id: string | null
          created_at: string
          created_by: string
          description: string
          expected_attendees: number
          id: string
          name: string
          risk_notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          club_id?: string | null
          created_at?: string
          created_by: string
          description: string
          expected_attendees: number
          id?: string
          name: string
          risk_notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          club_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          expected_attendees?: number
          id?: string
          name?: string
          risk_notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attachments: Json | null
          category: string | null
          club_id: string
          created_at: string
          created_by: string
          description: string
          end_at: string
          expected_attendees: number
          id: string
          last_decision_at: string | null
          policy_ack: Json | null
          risk_notes: string | null
          start_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          updated_by: string | null
          venue_id: string
        }
        Insert: {
          attachments?: Json | null
          category?: string | null
          club_id: string
          created_at?: string
          created_by: string
          description: string
          end_at: string
          expected_attendees: number
          id?: string
          last_decision_at?: string | null
          policy_ack?: Json | null
          risk_notes?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          venue_id: string
        }
        Update: {
          attachments?: Json | null
          category?: string | null
          club_id?: string
          created_at?: string
          created_by?: string
          description?: string
          end_at?: string
          expected_attendees?: number
          id?: string
          last_decision_at?: string | null
          policy_ack?: Json | null
          risk_notes?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          to_user_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          to_user_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          to_user_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          club_id: string | null
          created_at: string
          email: string
          id: string
          legacy_role: string | null
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          club_id?: string | null
          created_at?: string
          email: string
          id: string
          legacy_role?: string | null
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          club_id?: string | null
          created_at?: string
          email?: string
          id?: string
          legacy_role?: string | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      qr_tokens: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          active: boolean
          amenities: string[] | null
          capacity: number
          created_at: string
          id: string
          location: string
          name: string
          open_from: string | null
          open_to: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amenities?: string[] | null
          capacity: number
          created_at?: string
          id?: string
          location: string
          name: string
          open_from?: string | null
          open_to?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          id?: string
          location?: string
          name?: string
          open_from?: string | null
          open_to?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_venue_conflicts: {
        Args: {
          p_end_at: string
          p_event_id?: string
          p_start_at: string
          p_venue_id: string
        }
        Returns: {
          conflicting_event_id: string
          event_end: string
          event_start: string
          event_title: string
        }[]
      }
      get_user_roles: {
        Args: { _club_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "president"
        | "vice_president"
        | "academic_advisor"
        | "department_director"
        | "general_director"
        | "assistant_project_manager"
        | "project_manager"
        | "system_admin"
        | "member"
      approval_stage: "club" | "sa"
      approval_status: "approved" | "changes_required" | "rejected"
      event_status:
        | "draft"
        | "submitted"
        | "club_approved"
        | "sa_approved"
        | "changes_required"
        | "rejected"
        | "in_review"
        | "approved"
      notification_type:
        | "event_submitted"
        | "event_club_approved"
        | "event_sa_approved"
        | "event_changes_required"
        | "event_rejected"
        | "event_reminder"
        | "comment_added"
      user_role: "member" | "officer" | "sponsor" | "sa" | "admin"
      user_type: "student" | "psu_staff"
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
      app_role: [
        "president",
        "vice_president",
        "academic_advisor",
        "department_director",
        "general_director",
        "assistant_project_manager",
        "project_manager",
        "system_admin",
        "member",
      ],
      approval_stage: ["club", "sa"],
      approval_status: ["approved", "changes_required", "rejected"],
      event_status: [
        "draft",
        "submitted",
        "club_approved",
        "sa_approved",
        "changes_required",
        "rejected",
        "in_review",
        "approved",
      ],
      notification_type: [
        "event_submitted",
        "event_club_approved",
        "event_sa_approved",
        "event_changes_required",
        "event_rejected",
        "event_reminder",
        "comment_added",
      ],
      user_role: ["member", "officer", "sponsor", "sa", "admin"],
      user_type: ["student", "psu_staff"],
    },
  },
} as const
