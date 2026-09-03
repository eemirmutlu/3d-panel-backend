/**
 * src/types/database.types.ts
 *
 * Supabase database type definitions.
 *
 * Auto-generate via Supabase CLI in CI:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          username: string | null;
          bio: string | null;
          avatar_url: string | null;
          website_url: string | null;
          location: string | null;
          role: string;
          locale: string;
          is_verified: boolean;
          verified_at: string | null;
          is_private: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          location?: string | null;
          role?: string;
          locale?: string;
          is_verified?: boolean;
          verified_at?: string | null;
          is_private?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          location?: string | null;
          role?: string;
          locale?: string;
          is_verified?: boolean;
          verified_at?: string | null;
          is_private?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          uploader_id: string;
          type: string;
          mime_type: string;
          file_name: string | null;
          size_bytes: number | null;
          url: string;
          storage_path: string;
          bucket: string;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          uploader_id: string;
          type: string;
          mime_type: string;
          file_name?: string | null;
          size_bytes?: number | null;
          url: string;
          storage_path: string;
          bucket?: string;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: {
          uploader_id?: string;
          type?: string;
          mime_type?: string;
          file_name?: string | null;
          size_bytes?: number | null;
          url?: string;
          storage_path?: string;
          bucket?: string;
          alt_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'media_uploader_id_fkey';
            columns: ['uploader_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          requester_id?: string;
          addressee_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_requester_id_fkey';
            columns: ['requester_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_addressee_id_fkey';
            columns: ['addressee_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'user' | 'admin' | 'moderator';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
