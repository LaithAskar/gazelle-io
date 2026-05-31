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
  public: {
    Tables: {
      agent_logs: {
        Row: {
          agent: string
          created_at: string | null
          filter_result: Json | null
          id: string
          input: Json | null
          output: Json | null
          reason: string | null
          reviewed_at: string | null
          session_id: string | null
          status: string
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          agent: string
          created_at?: string | null
          filter_result?: Json | null
          id?: string
          input?: Json | null
          output?: Json | null
          reason?: string | null
          reviewed_at?: string | null
          session_id?: string | null
          status?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          agent?: string
          created_at?: string | null
          filter_result?: Json | null
          id?: string
          input?: Json | null
          output?: Json | null
          reason?: string | null
          reviewed_at?: string | null
          session_id?: string | null
          status?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_knowledge: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          grade: number | null
          id: string
          metadata: Json | null
          source: string
          source_url: string | null
          standard_id: string | null
          subject: string | null
          token_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          grade?: number | null
          id?: string
          metadata?: Json | null
          source: string
          source_url?: string | null
          standard_id?: string | null
          subject?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          grade?: number | null
          id?: string
          metadata?: Json | null
          source?: string
          source_url?: string | null
          standard_id?: string | null
          subject?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_knowledge_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "curriculum_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_standards: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          grade: number
          id: string
          source: string
          subject: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          grade: number
          id?: string
          source?: string
          subject: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          grade?: number
          id?: string
          source?: string
          subject?: string
        }
        Relationships: []
      }
      insight_reports: {
        Row: {
          created_at: string | null
          id: string
          report: Json
          teacher_id: string
          timeframe_end: string | null
          timeframe_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          report: Json
          teacher_id: string
          timeframe_end?: string | null
          timeframe_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          report?: Json
          teacher_id?: string
          timeframe_end?: string | null
          timeframe_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_reports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          content: Json
          created_at: string | null
          duration_minutes: number | null
          grade: number
          id: string
          objectives: string | null
          standard_ids: string[] | null
          status: string
          subject: string
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          duration_minutes?: number | null
          grade: number
          id?: string
          objectives?: string | null
          standard_ids?: string[] | null
          status?: string
          subject: string
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          duration_minutes?: number | null
          grade?: number
          id?: string
          objectives?: string | null
          standard_ids?: string[] | null
          status?: string
          subject?: string
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          choices: Json | null
          correct_answer: string | null
          created_at: string | null
          difficulty: string | null
          grade: number | null
          id: string
          lesson_plan_id: string
          prompt: string
          question_type: string | null
          subject: string | null
        }
        Insert: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          grade?: number | null
          id?: string
          lesson_plan_id: string
          prompt: string
          question_type?: string | null
          subject?: string | null
        }
        Update: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          grade?: number | null
          id?: string
          lesson_plan_id?: string
          prompt?: string
          question_type?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      session_responses: {
        Row: {
          difficulty: string | null
          id: string
          is_correct: boolean | null
          question_id: string | null
          responded_at: string | null
          response_data: Json | null
          session_id: string
        }
        Insert: {
          difficulty?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          responded_at?: string | null
          response_data?: Json | null
          session_id: string
        }
        Update: {
          difficulty?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          responded_at?: string | null
          response_data?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          lesson_plan_id: string | null
          started_at: string | null
          status: string
          student_id: string
          summary: Json | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          lesson_plan_id?: string | null
          started_at?: string | null
          status?: string
          student_id: string
          summary?: Json | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          lesson_plan_id?: string | null
          started_at?: string | null
          status?: string
          student_id?: string
          summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          age: number | null
          created_at: string | null
          grade: number
          id: string
          name: string
          pace: string | null
          parent_id: string
          strength_subjects: string[] | null
          struggle_subjects: string[] | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          grade: number
          id?: string
          name: string
          pace?: string | null
          parent_id: string
          strength_subjects?: string[] | null
          struggle_subjects?: string[] | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          grade?: number
          id?: string
          name?: string
          pace?: string | null
          parent_id?: string
          strength_subjects?: string[] | null
          struggle_subjects?: string[] | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          school: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          school?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          school?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_parent_id: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
