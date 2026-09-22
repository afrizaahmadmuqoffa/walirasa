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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aac_cards: {
        Row: {
          audio_text: string
          category_id: string | null
          child_id: string | null
          created_at: string
          created_by: string | null
          icon_url: string
          id: string
          is_active: boolean
          label_text: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          audio_text: string
          category_id?: string | null
          child_id?: string | null
          created_at?: string
          created_by?: string | null
          icon_url: string
          id?: string
          is_active?: boolean
          label_text: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          audio_text?: string
          category_id?: string | null
          child_id?: string | null
          created_at?: string
          created_by?: string | null
          icon_url?: string
          id?: string
          is_active?: boolean
          label_text?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aac_cards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "aac_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aac_cards_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aac_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aac_categories: {
        Row: {
          child_id: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          child_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "aac_categories_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      aac_usage_logs: {
        Row: {
          card_id: string | null
          child_id: string
          id: string
          used_at: string
        }
        Insert: {
          card_id?: string | null
          child_id: string
          id?: string
          used_at?: string
        }
        Update: {
          card_id?: string | null
          child_id?: string
          id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aac_usage_logs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "aac_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aac_usage_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          child_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_access: {
        Row: {
          access_role: Database["public"]["Enums"]["access_role"]
          child_id: string
          created_at: string
          educator_id: string | null
          expires_at: string
          granted_at: string
          id: string
          invite_email: string | null
          invite_token: string
          invited_by: string
          is_active: boolean
          permissions: Json
          revoked_at: string | null
        }
        Insert: {
          access_role: Database["public"]["Enums"]["access_role"]
          child_id: string
          created_at?: string
          educator_id?: string | null
          expires_at: string
          granted_at?: string
          id?: string
          invite_email?: string | null
          invite_token?: string
          invited_by: string
          is_active?: boolean
          permissions?: Json
          revoked_at?: string | null
        }
        Update: {
          access_role?: Database["public"]["Enums"]["access_role"]
          child_id?: string
          created_at?: string
          educator_id?: string | null
          expires_at?: string
          granted_at?: string
          id?: string
          invite_email?: string | null
          invite_token?: string
          invited_by?: string
          is_active?: boolean
          permissions?: Json
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_access_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_access_educator_id_fkey"
            columns: ["educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_access_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          asd_support_level: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          full_name: string
          id: string
          nickname: string | null
          notes: string | null
          parent_id: string
          updated_at: string
        }
        Insert: {
          asd_support_level?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name: string
          id?: string
          nickname?: string | null
          notes?: string | null
          parent_id: string
          updated_at?: string
        }
        Update: {
          asd_support_level?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          nickname?: string | null
          notes?: string | null
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_mirror_logs: {
        Row: {
          child_id: string
          confidence: number
          emotion_detected: string
          emotion_target: string
          id: string
          is_match: boolean | null
          recorded_at: string
          session_id: string | null
        }
        Insert: {
          child_id: string
          confidence: number
          emotion_detected: string
          emotion_target: string
          id?: string
          is_match?: boolean | null
          recorded_at?: string
          session_id?: string | null
        }
        Update: {
          child_id?: string
          confidence?: number
          emotion_detected?: string
          emotion_target?: string
          id?: string
          is_match?: boolean | null
          recorded_at?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_mirror_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      iep_goals: {
        Row: {
          child_id: string
          created_at: string
          created_by: string
          current_value: number | null
          description: string | null
          id: string
          start_date: string
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          target_metric: string | null
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by: string
          current_value?: number | null
          description?: string | null
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string
          current_value?: number | null
          description?: string | null
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iep_goals_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iep_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      iep_recommendations: {
        Row: {
          based_on_data: Json | null
          generated_at: string
          goal_id: string
          id: string
          recommendation: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          based_on_data?: Json | null
          generated_at?: string
          goal_id: string
          id?: string
          recommendation: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          based_on_data?: Json | null
          generated_at?: string
          goal_id?: string
          id?: string
          recommendation?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iep_recommendations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "iep_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iep_recommendations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_skill_progress: {
        Row: {
          attempts_count: number
          child_id: string
          id: string
          last_attempted_at: string | null
          mastered_at: string | null
          status: Database["public"]["Enums"]["skill_progress_status"]
          step_id: string
        }
        Insert: {
          attempts_count?: number
          child_id: string
          id?: string
          last_attempted_at?: string | null
          mastered_at?: string | null
          status?: Database["public"]["Enums"]["skill_progress_status"]
          step_id: string
        }
        Update: {
          attempts_count?: number
          child_id?: string
          id?: string
          last_attempted_at?: string | null
          mastered_at?: string | null
          status?: Database["public"]["Enums"]["skill_progress_status"]
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_skill_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_skill_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "life_skill_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      life_skill_steps: {
        Row: {
          audio_instruction: string
          description: string | null
          id: string
          media_url: string | null
          skill_id: string
          step_order: number
          success_criteria: string | null
          title: string
        }
        Insert: {
          audio_instruction: string
          description?: string | null
          id?: string
          media_url?: string | null
          skill_id: string
          step_order: number
          success_criteria?: string | null
          title: string
        }
        Update: {
          audio_instruction?: string
          description?: string | null
          id?: string
          media_url?: string | null
          skill_id?: string
          step_order?: number
          success_criteria?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_skill_steps_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "life_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      life_skills: {
        Row: {
          category: string | null
          child_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_template: boolean
          title: string
        }
        Insert: {
          category?: string | null
          child_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean
          title: string
        }
        Update: {
          category?: string | null
          child_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_skills_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_skills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_reports: {
        Row: {
          child_id: string
          content_text: string
          created_at: string
          generated_by: string
          id: string
          period_end: string
          period_start: string
        }
        Insert: {
          child_id: string
          content_text: string
          created_at?: string
          generated_by?: string
          id?: string
          period_end: string
          period_start: string
        }
        Update: {
          child_id?: string
          content_text?: string
          created_at?: string
          generated_by?: string
          id?: string
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      social_stories: {
        Row: {
          child_id: string | null
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["story_difficulty"]
          generated_by: string
          id: string
          title: string
          topic: string | null
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["story_difficulty"]
          generated_by?: string
          id?: string
          title: string
          topic?: string | null
        }
        Update: {
          child_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["story_difficulty"]
          generated_by?: string
          id?: string
          title?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_stories_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_story_attempts: {
        Row: {
          attempted_at: string
          child_id: string
          choice_id: string | null
          id: string
          story_id: string
          was_appropriate: boolean | null
        }
        Insert: {
          attempted_at?: string
          child_id: string
          choice_id?: string | null
          id?: string
          story_id: string
          was_appropriate?: boolean | null
        }
        Update: {
          attempted_at?: string
          child_id?: string
          choice_id?: string | null
          id?: string
          story_id?: string
          was_appropriate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "social_story_attempts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_story_attempts_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "social_story_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_story_attempts_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "social_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      social_story_choices: {
        Row: {
          choice_label: string
          choice_text: string
          id: string
          is_appropriate: boolean
          story_id: string
        }
        Insert: {
          choice_label: string
          choice_text: string
          id?: string
          is_appropriate?: boolean
          story_id: string
        }
        Update: {
          choice_label?: string
          choice_text?: string
          id?: string
          is_appropriate?: boolean
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_story_choices_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "social_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      social_story_panels: {
        Row: {
          audio_text: string
          id: string
          image_description: string | null
          panel_number: number
          story_id: string
          story_text: string
        }
        Insert: {
          audio_text: string
          id?: string
          image_description?: string | null
          panel_number: number
          story_id: string
          story_text: string
        }
        Update: {
          audio_text?: string
          id?: string
          image_description?: string | null
          panel_number?: number
          story_id?: string
          story_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_story_panels_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "social_stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_child: { Args: { p_child_id: string }; Returns: boolean }
      has_active_child_access: {
        Args: { p_child_id: string }
        Returns: boolean
      }
      is_parent_of_child: { Args: { p_child_id: string }; Returns: boolean }
    }
    Enums: {
      access_role: "teacher" | "therapist"
      goal_status: "active" | "completed" | "archived"
      skill_progress_status:
        | "not_started"
        | "in_progress"
        | "mastered"
        | "needs_repeat"
      story_difficulty: "easy" | "medium" | "hard"
      user_role: "parent" | "teacher" | "therapist"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_role: ["teacher", "therapist"],
      goal_status: ["active", "completed", "archived"],
      skill_progress_status: [
        "not_started",
        "in_progress",
        "mastered",
        "needs_repeat",
      ],
      story_difficulty: ["easy", "medium", "hard"],
      user_role: ["parent", "teacher", "therapist"],
    },
  },
} as const
