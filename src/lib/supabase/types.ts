export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      lead_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          data: NonNullable<Json>;
          id: string;
          kind: Database["public"]["Enums"]["lead_event_kind"];
          lead_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          kind: Database["public"]["Enums"]["lead_event_kind"];
          lead_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          kind?: Database["public"]["Enums"]["lead_event_kind"];
          lead_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_files: {
        Row: {
          created_at: string;
          id: string;
          lead_id: string;
          name: string;
          path: string;
          size: number;
          uploaded_by: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          lead_id: string;
          name: string;
          path: string;
          size: number;
          uploaded_by?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lead_id?: string;
          name?: string;
          path?: string;
          size?: number;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_files_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_files_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_notes: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          lead_id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string;
          body: string;
          created_at?: string;
          id?: string;
          lead_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          lead_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          city: string;
          consent: boolean;
          contact_name: string;
          created_at: string;
          email: string;
          engine_version: string;
          hotel_name: string;
          id: string;
          inputs: NonNullable<Json>;
          message: string | null;
          owner_id: string | null;
          phone: string | null;
          project_id: string | null;
          results: NonNullable<Json>;
          rooms: number;
          status: Database["public"]["Enums"]["lead_status"];
        };
        ComputedFields: never;
        Insert: {
          city: string;
          consent: boolean;
          contact_name: string;
          created_at?: string;
          email: string;
          engine_version: string;
          hotel_name: string;
          id?: string;
          inputs: NonNullable<Json>;
          message?: string | null;
          owner_id?: string | null;
          phone?: string | null;
          project_id?: string | null;
          results: NonNullable<Json>;
          rooms: number;
          status?: Database["public"]["Enums"]["lead_status"];
        };
        Update: {
          city?: string;
          consent?: boolean;
          contact_name?: string;
          created_at?: string;
          email?: string;
          engine_version?: string;
          hotel_name?: string;
          id?: string;
          inputs?: NonNullable<Json>;
          message?: string | null;
          owner_id?: string | null;
          phone?: string | null;
          project_id?: string | null;
          results?: NonNullable<Json>;
          rooms?: number;
          status?: Database["public"]["Enums"]["lead_status"];
        };
        Relationships: [
          {
            foreignKeyName: "leads_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          engine_version: string;
          hotel_name: string;
          id: string;
          inputs: NonNullable<Json>;
          owner_id: string;
          results: NonNullable<Json>;
          share_token: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          engine_version: string;
          hotel_name: string;
          id?: string;
          inputs: NonNullable<Json>;
          owner_id?: string;
          results: NonNullable<Json>;
          share_token?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          engine_version?: string;
          hotel_name?: string;
          id?: string;
          inputs?: NonNullable<Json>;
          owner_id?: string;
          results?: NonNullable<Json>;
          share_token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      study_request_attempts: {
        Row: {
          created_at: string;
          id: number;
          key: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: never;
          key: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          key?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_shared_project: {
        Args: { token: string };
        Returns: {
          created_at: string;
          engine_version: string;
          hotel_name: string;
          inputs: Json;
          results: Json;
        }[];
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      next_lead_owner: { Args: Record<PropertyKey, never>; Returns: string };
      take_study_request_slot: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
    };
    Enums: {
      lead_event_kind: "created" | "status" | "owner" | "email" | "note" | "file";
      lead_status: "new" | "contacted" | "quoted" | "won" | "lost";
      user_role: "user" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      lead_event_kind: ["created", "status", "owner", "email", "note", "file"],
      lead_status: ["new", "contacted", "quoted", "won", "lost"],
      user_role: ["user", "admin"],
    },
  },
} as const;
