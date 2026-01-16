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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          resource_id: string
          resource_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string
          resource_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          note: string
          resource_id: string
          resource_type: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id: string
          note: string
          resource_id: string
          resource_type: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          note?: string
          resource_id?: string
          resource_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          backup_codes: string[] | null
          can_manage_admins: boolean | null
          can_manage_categories: boolean | null
          can_manage_content: boolean | null
          can_manage_products: boolean | null
          can_manage_reports: boolean | null
          can_manage_settings: boolean | null
          can_manage_users: boolean | null
          can_view_analytics: boolean | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          permissions: Json | null
          role: string | null
          two_factor_enabled: boolean | null
          two_factor_method: string | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          can_manage_admins?: boolean | null
          can_manage_categories?: boolean | null
          can_manage_content?: boolean | null
          can_manage_products?: boolean | null
          can_manage_reports?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_users?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          can_manage_admins?: boolean | null
          can_manage_categories?: boolean | null
          can_manage_content?: boolean | null
          can_manage_products?: boolean | null
          can_manage_reports?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_users?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_revoked: boolean | null
          last_activity: string | null
          session_token: string
          two_factor_verified: boolean | null
          used_backup_code: boolean | null
          user_agent: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_activity?: string | null
          session_token: string
          two_factor_verified?: boolean | null
          used_backup_code?: boolean | null
          user_agent?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_activity?: string | null
          session_token?: string
          two_factor_verified?: boolean | null
          used_backup_code?: boolean | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          parent_id: string | null
          properties: Json | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_url?: string | null
          id: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          parent_id?: string | null
          properties?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          parent_id?: string | null
          properties?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          updated_at: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          last_message_at?: string | null
          updated_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_favorites_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string
          product_id: string | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id: string
          is_read?: boolean | null
          message_text: string
          product_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          product_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          id: string
          price: number | null
          product_id: string | null
          seller_id: string | null
          status: string | null
          total_price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          id: string
          price?: number | null
          product_id?: string | null
          seller_id?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          price?: number | null
          product_id?: string | null
          seller_id?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          duration_days: number | null
          features: Json | null
          id: string
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string | null
          duration_days?: number | null
          features?: Json | null
          id: string
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      product_views: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_views_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          brand: string | null
          category: string | null
          category_id: string | null
          comments_count: number | null
          condition: string | null
          created_at: string | null
          description: string | null
          email: string | null
          expires_at: string | null
          featured: boolean | null
          featured_at: string | null
          id: string
          images: string[] | null
          is_deleted: boolean | null
          is_negotiable: boolean | null
          is_urgent: boolean | null
          latitude: number | null
          likes_count: number | null
          location: string
          longitude: number | null
          name: string
          original_price: number | null
          owner_id: string
          phone: string | null
          plan_type: string | null
          price: number
          properties: Json | null
          rejection_reason: string | null
          shares_count: number | null
          status: string | null
          subcategory: string | null
          subcategory_id: string | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          verified_at: string | null
          video_url: string | null
          views: number | null
          views_count: number | null
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand?: string | null
          category?: string | null
          category_id?: string | null
          comments_count?: number | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          expires_at?: string | null
          featured?: boolean | null
          featured_at?: string | null
          id?: string
          images?: string[] | null
          is_deleted?: boolean | null
          is_negotiable?: boolean | null
          is_urgent?: boolean | null
          latitude?: number | null
          likes_count?: number | null
          location: string
          longitude?: number | null
          name: string
          original_price?: number | null
          owner_id: string
          phone?: string | null
          plan_type?: string | null
          price: number
          properties?: Json | null
          rejection_reason?: string | null
          shares_count?: number | null
          status?: string | null
          subcategory?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          video_url?: string | null
          views?: number | null
          views_count?: number | null
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand?: string | null
          category?: string | null
          category_id?: string | null
          comments_count?: number | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          expires_at?: string | null
          featured?: boolean | null
          featured_at?: string | null
          id?: string
          images?: string[] | null
          is_deleted?: boolean | null
          is_negotiable?: boolean | null
          is_urgent?: boolean | null
          latitude?: number | null
          likes_count?: number | null
          location?: string
          longitude?: number | null
          name?: string
          original_price?: number | null
          owner_id?: string
          phone?: string | null
          plan_type?: string | null
          price?: number
          properties?: Json | null
          rejection_reason?: string | null
          shares_count?: number | null
          status?: string | null
          subcategory?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          video_url?: string | null
          views?: number | null
          views_count?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products_backup: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: number | null
          brand: string | null
          category: string | null
          category_id: string | null
          comments_count: number | null
          condition: string | null
          created_at: string | null
          description: string | null
          email: string | null
          expires_at: string | null
          featured: boolean | null
          featured_at: string | null
          id: string | null
          images: string[] | null
          is_deleted: boolean | null
          is_negotiable: boolean | null
          is_urgent: boolean | null
          latitude: number | null
          likes_count: number | null
          location: string | null
          longitude: number | null
          name: string | null
          original_price: number | null
          owner_id: number | null
          phone: string | null
          plan_type: string | null
          price: number | null
          properties: Json | null
          rejection_reason: string | null
          seller_id: string | null
          shares_count: number | null
          status: string | null
          subcategory: string | null
          subcategory_id: number | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          video_url: string | null
          views: number | null
          views_count: number | null
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: number | null
          brand?: string | null
          category?: string | null
          category_id?: string | null
          comments_count?: number | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          expires_at?: string | null
          featured?: boolean | null
          featured_at?: string | null
          id?: string | null
          images?: string[] | null
          is_deleted?: boolean | null
          is_negotiable?: boolean | null
          is_urgent?: boolean | null
          latitude?: number | null
          likes_count?: number | null
          location?: string | null
          longitude?: number | null
          name?: string | null
          original_price?: number | null
          owner_id?: number | null
          phone?: string | null
          plan_type?: string | null
          price?: number | null
          properties?: Json | null
          rejection_reason?: string | null
          seller_id?: string | null
          shares_count?: number | null
          status?: string | null
          subcategory?: string | null
          subcategory_id?: number | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          video_url?: string | null
          views?: number | null
          views_count?: number | null
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: number | null
          brand?: string | null
          category?: string | null
          category_id?: string | null
          comments_count?: number | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          expires_at?: string | null
          featured?: boolean | null
          featured_at?: string | null
          id?: string | null
          images?: string[] | null
          is_deleted?: boolean | null
          is_negotiable?: boolean | null
          is_urgent?: boolean | null
          latitude?: number | null
          likes_count?: number | null
          location?: string | null
          longitude?: number | null
          name?: string | null
          original_price?: number | null
          owner_id?: number | null
          phone?: string | null
          plan_type?: string | null
          price?: number | null
          properties?: Json | null
          rejection_reason?: string | null
          seller_id?: string | null
          shares_count?: number | null
          status?: string | null
          subcategory?: string | null
          subcategory_id?: number | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          video_url?: string | null
          views?: number | null
          views_count?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          plan_type: string | null
          rating: number | null
          status: string | null
          total_ratings: number | null
          total_reviews: number | null
          updated_at: string | null
          username: string | null
          warning_count: number | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          plan_type?: string | null
          rating?: number | null
          status?: string | null
          total_ratings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          username?: string | null
          warning_count?: number | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          plan_type?: string | null
          rating?: number | null
          status?: string | null
          total_ratings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          username?: string | null
          warning_count?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          referral_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code_used: string | null
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          referral_code_used?: string | null
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code_used?: string | null
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          report_type: string | null
          reported_id: string | null
          reporter_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          reason?: string | null
          report_type?: string | null
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          report_type?: string | null
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful: {
        Row: {
          created_at: string | null
          id: string
          review_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          review_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified: boolean | null
          product_id: string | null
          rating: number | null
          reviewee_id: string | null
          reviewer_id: string | null
          seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id: string
          is_verified?: boolean | null
          product_id?: string | null
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          product_id?: string | null
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_backup: {
        Row: {
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string | null
          is_verified: boolean | null
          product_id: string | null
          rating: number | null
          reviewee_id: string | null
          reviewer_id: string | null
          seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string | null
          is_verified?: boolean | null
          product_id?: string | null
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string | null
          is_verified?: boolean | null
          product_id?: string | null
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          query: string | null
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          query?: string | null
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string | null
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string | null
          starts_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id: string
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_plans_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id: string
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      message_with_receiver: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string | null
          is_read: boolean | null
          message_text: string | null
          receiver_id: string | null
          sender_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_user_profile: {
        Args: {
          user_email: string
          user_id: string
          user_name?: string
          user_username?: string
        }
        Returns: undefined
      }
      generate_referral_code: { Args: never; Returns: string }
      is_admin: { Args: { user_uuid?: string }; Returns: boolean }
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
// Add to your existing interfaces
interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  target_url?: string;
  type: string;
  status: string;
  priority: number;
  start_date?: string;
  end_date?: string;
  button_text?: string;
  button_color?: string;
  text_color?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  creator_email?: string;
}   