import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];

export interface Conversation extends ConversationRow {
  products?: ProductRow | null;
  user_profile?: ProfileRow;
  last_message?: MessageRow;
  unread_count?: number;
}

export interface Message extends MessageRow {
  isOwn?: boolean;
  status?: "sent" | "delivered" | "read";
  displayTime?: string;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  image: string;
  condition?: string;
  location?: string;
}

export class MessagesServiceError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MessagesServiceError';
  }
}

export const messagesService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      if (!userId) {
        throw new MessagesServiceError('User ID is required to fetch conversations');
      }

      console.log('Fetching conversations for user:', userId);

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          product_id,
          created_at,
          updated_at,
          products (
            id,
            name,
            price,
            images,
            condition,
            location
          )
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching conversations:', error);
        throw new MessagesServiceError(
          `Failed to load conversations: ${error.message}`,
          error,
          { userId, errorCode: error.code }
        );
      }

      if (!conversations || conversations.length === 0) {
        console.log('No conversations found for user:', userId);
        return [];
      }

      console.log(`Found ${conversations.length} conversations for user:`, userId);

      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv): Promise<Conversation> => {
          try {
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
            
            if (!otherUserId) {
              console.warn('No other user ID found for conversation:', conv.id);
              return {
                ...conv,
                user_profile: undefined,
                last_message: undefined,
                unread_count: 0
              };
            }

            // Get user profile with error handling
            let userProfile: ProfileRow | undefined;
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, username')
                .eq('id', otherUserId)
                .single();

              if (profileError) {
                console.warn(`Error fetching profile for user ${otherUserId}:`, profileError);
              } else {
                userProfile = profileData;
              }
            } catch (profileError) {
              console.warn(`Failed to load profile for user ${otherUserId}:`, profileError);
            }

            // Get last message with error handling
            let lastMessage: MessageRow | undefined;
            try {
              const { data: messageData, error: messageError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (messageError && messageError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.warn(`Error fetching last message for conversation ${conv.id}:`, messageError);
              } else if (messageData) {
                lastMessage = messageData;
              }
            } catch (messageError) {
              console.warn(`Failed to load last message for conversation ${conv.id}:`, messageError);
            }

            // Get unread count with error handling
            let unreadCount = 0;
            try {
              const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('is_read', false)
                .neq('sender_id', userId);

              if (countError) {
                console.warn(`Error counting unread messages for conversation ${conv.id}:`, countError);
              } else {
                unreadCount = count || 0;
              }
            } catch (countError) {
              console.warn(`Failed to count unread messages for conversation ${conv.id}:`, countError);
            }

            return {
              ...conv,
              user_profile: userProfile,
              last_message: lastMessage,
              unread_count: unreadCount
            };
          } catch (error) {
            console.error(`Error processing conversation ${conv.id}:`, error);
            // Return basic conversation info even if there are errors
            return {
              ...conv,
              user_profile: undefined,
              last_message: undefined,
              unread_count: 0
            };
          }
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Error in getConversations:', error);
      if (error instanceof MessagesServiceError) {
        throw error;
      }
      throw new MessagesServiceError(
        'Failed to load conversations due to an unexpected error',
        error,
        { userId }
      );
    }
  },

  async getMessages(conversationId: string, currentUserId: string): Promise<Message[]> {
    try {
      if (!conversationId) {
        throw new MessagesServiceError('Conversation ID is required to fetch messages');
      }

      if (!currentUserId) {
        throw new MessagesServiceError('Current user ID is required to fetch messages');
      }

      console.log('Fetching messages for conversation:', conversationId);

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error fetching messages:', error);
        throw new MessagesServiceError(
          `Failed to load messages: ${error.message}`,
          error,
          { conversationId, errorCode: error.code }
        );
      }

      // Mark messages as read in background (don't block on this)
      this.markMessagesAsRead(conversationId, currentUserId).catch(readError => {
        console.warn('Failed to mark messages as read:', readError);
      });

      return messages || [];
    } catch (error) {
      console.error('Error in getMessages:', error);
      if (error instanceof MessagesServiceError) {
        throw error;
      }
      throw new MessagesServiceError(
        'Failed to load messages due to an unexpected error',
        error,
        { conversationId, currentUserId }
      );
    }
  },

  async sendMessage(
    conversationId: string, 
    senderId: string, 
    receiverId: string,
    content: string, 
    messageType: string = 'text',
    productData?: ProductData
  ): Promise<Message> {
    try {
      if (!conversationId) {
        throw new MessagesServiceError('Conversation ID is required to send message');
      }

      if (!senderId) {
        throw new MessagesServiceError('Sender ID is required to send message');
      }

      if (!receiverId) {
        throw new MessagesServiceError('Receiver ID is required to send message');
      }

      if (!content?.trim()) {
        throw new MessagesServiceError('Message content cannot be empty');
      }

      console.log('Sending message in conversation:', conversationId);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
          message_type: messageType,
          product_data: productData || null,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error sending message:', error);
        throw new MessagesServiceError(
          `Failed to send message: ${error.message}`,
          error,
          { 
            conversationId, 
            senderId, 
            receiverId, 
            messageType,
            errorCode: error.code 
          }
        );
      }

      // Update conversation timestamp in background
      this.updateConversationTimestamp(conversationId).catch(updateError => {
        console.warn('Failed to update conversation timestamp:', updateError);
      });

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (error instanceof MessagesServiceError) {
        throw error;
      }
      throw new MessagesServiceError(
        'Failed to send message due to an unexpected error',
        error,
        { conversationId, senderId, receiverId, messageType }
      );
    }
  },

  async sendNewMessage(
    senderId: string, 
    receiverId: string, 
    content: string, 
    productId?: string,
    messageType: string = 'text',
    productData?: ProductData
  ): Promise<Message> {
    try {
      if (!senderId) {
        throw new MessagesServiceError('Sender ID is required to send message');
      }

      if (!receiverId) {
        throw new MessagesServiceError('Receiver ID is required to send message');
      }

      if (!content?.trim()) {
        throw new MessagesServiceError('Message content cannot be empty');
      }

      console.log('Creating new conversation and sending message');

      const conversationId = await this.getOrCreateConversation(senderId, receiverId, productId);
      return await this.sendMessage(conversationId, senderId, receiverId, content, messageType, productData);
    } catch (error) {
      console.error('Error in sendNewMessage:', error);
      if (error instanceof MessagesServiceError) {
        throw error;
      }
      throw new MessagesServiceError(
        'Failed to send new message due to an unexpected error',
        error,
        { senderId, receiverId, productId, messageType }
      );
    }
  },

  async getOrCreateConversation(user1Id: string, user2Id: string, productId?: string): Promise<string> {
    try {
      if (!user1Id || !user2Id) {
        throw new MessagesServiceError('Both user IDs are required to get or create conversation');
      }

      console.log('Getting or creating conversation between users:', user1Id, user2Id);

      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: user1Id,
          p_user2_id: user2Id,
          p_product_id: productId
        });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw new MessagesServiceError(
          `Failed to create conversation: ${error.message}`,
          error,
          { user1Id, user2Id, productId, errorCode: error.code }
        );
      }

      if (!data) {
        throw new MessagesServiceError(
          'Failed to create conversation: No conversation ID returned',
          undefined,
          { user1Id, user2Id, productId }
        );
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      if (error instanceof MessagesServiceError) {
        throw error;
      }
      throw new MessagesServiceError(
        'Failed to get or create conversation due to an unexpected error',
        error,
        { user1Id, user2Id, productId }
      );
    }
  },

  async markMessagesAsRead(conversationId: string, currentUserId: string): Promise<void> {
    try {
      if (!conversationId) {
        console.warn('No conversation ID provided to mark messages as read');
        return;
      }

      if (!currentUserId) {
        console.warn('No current user ID provided to mark messages as read');
        return;
      }

      console.log('Marking messages as read for conversation:', conversationId);

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);

      if (error) {
        console.warn('Error marking messages as read:', error);
        // Don't throw for this operation as it's not critical
        return;
      }

      console.log('Successfully marked messages as read for conversation:', conversationId);
    } catch (error) {
      console.warn('Unexpected error marking messages as read:', error);
      // Don't throw for this operation as it's not critical
    }
  },

  async searchConversations(userId: string, searchQuery: string): Promise<Conversation[]> {
    try {
      if (!userId) {
        throw new MessagesServiceError('User ID is required to search conversations');
      }

      if (!searchQuery?.trim()) {
        // If search query is empty, return all conversations
        return await this.getConversations(userId);
      }

      console.log('Searching conversations with query:', searchQuery);

      const conversations = await this.getConversations(userId);
      const query = searchQuery.toLowerCase().trim();

      const filteredConversations = conversations.filter(conv => {
        const userNameMatch = conv.user_profile?.full_name?.toLowerCase().includes(query) ||
                            conv.user_profile?.username?.toLowerCase().includes(query);
        
        const productNameMatch = conv.products?.name?.toLowerCase().includes(query);
        
        const lastMessageMatch = conv.last_message?.content?.toLowerCase().includes(query);

        return userNameMatch || productNameMatch || lastMessageMatch;
      });

      console.log(`Found ${filteredConversations.length} conversations matching search query`);

      return filteredConversations;
    } catch (error) {
      console.error('Error in searchConversations:', error);
      if (error instanceof MessagesServiceError) {
        throw error;
      }
      throw new MessagesServiceError(
        'Failed to search conversations due to an unexpected error',
        error,
        { userId, searchQuery }
      );
    }
  },

  async deleteMessage(messageId: string): Promise<void> {
    try {
      if (!messageId) {
        throw new MessagesServiceError('Message ID is required to delete message');
      }

      console.log('Deleting message:', messageId);

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Supabase error deleting message:', error);
        throw new MessagesServiceError(
          `Failed to delete message: ${error.message}`,
          error,
          { messageId, errorCode: error.code }
        );
      }

      console.log('Successfully deleted message:', messageId);
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      if (error instanceof MessagesServiceError) {
        throw error;
      }
      throw new MessagesServiceError(
        'Failed to delete message due to an unexpected error',
        error,
        { messageId }
      );
    }
  },

  async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      if (!conversationId) {
        console.warn('No conversation ID provided to update timestamp');
        return;
      }

      const { error } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        console.warn('Error updating conversation timestamp:', error);
        // Don't throw for this operation as it's not critical
      }
    } catch (error) {
      console.warn('Unexpected error updating conversation timestamp:', error);
      // Don't throw for this operation as it's not critical
    }
  },

  // Utility method to check if service is working
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Health check failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Health check failed with unexpected error:', error);
      return false;
    }
  }
};