import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { api } from '../config/api';

// User messages auto-delete after this many milliseconds
const MESSAGE_LIFETIME_MS = 10000;

const ChatContext = createContext({});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [myConversation, setMyConversation] = useState(null);
  const pollRef = useRef(null);

  // Fetch all conversations (admin)
  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get('/chat/conversations');
      if (data.success) {
        const mapped = data.conversations.map((c) => ({
          ...c,
          id: c.id || c._id,
        }));
        setConversations(mapped);
      }
    } catch (error) {
      // Not admin or not logged in — ignore
    }
  }, []);

  // Fetch user's own conversation
  const fetchMyConversation = useCallback(async () => {
    try {
      const data = await api.get('/chat/my');
      if (data.success) {
        const conv = data.conversation;
        conv.id = conv.id || conv._id;
        // Format message IDs and timestamps
        conv.messages = (conv.messages || []).map((m) => ({
          ...m,
          id: m.id || m._id,
          timestamp: m.timestamp || new Date().toISOString(),
        }));
        setMyConversation(conv);

        // Also update in the conversations list
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === conv.id || c.userId === conv.userId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = conv;
            return updated;
          }
          return prev;
        });
      }
    } catch (error) {
      // Not logged in — ignore
    }
  }, []);

  // Get or create a conversation for a user (returns cached version)
  const getOrCreateConversation = useCallback((user) => {
    if (myConversation && myConversation.userId === user.uid) {
      return myConversation;
    }
    // Trigger a fetch
    fetchMyConversation();
    // Return a temporary object
    return myConversation || {
      id: 'temp',
      userId: user.uid,
      userName: user.displayName || 'Student',
      messages: [],
    };
  }, [myConversation, fetchMyConversation]);

  // Send a message
  const sendMessage = useCallback(async (conversationId, text, sender) => {
    try {
      const data = await api.post('/chat/send', {
        conversationId: conversationId === 'temp' ? undefined : conversationId,
        text,
        targetUserId: sender.uid,
      });

      if (data.success) {
        const newMsg = {
          ...data.message,
          id: data.message.id || data.message._id,
        };

        // Optimistically update local state
        if (myConversation) {
          setMyConversation((prev) => prev ? {
            ...prev,
            messages: [...prev.messages, newMsg],
            lastMessage: text,
            lastMessageTime: new Date().toISOString(),
          } : prev);
        }

        // Update conversations list
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [...conv.messages, newMsg],
                lastMessage: text,
                lastMessageTime: new Date().toISOString(),
                unreadByAdmin: sender.role === 'user' ? (conv.unreadByAdmin || 0) + 1 : 0,
                unreadByUser: sender.role === 'admin' ? (conv.unreadByUser || 0) + 1 : 0,
              };
            }
            return conv;
          })
        );

        return newMsg;
      }
    } catch (error) {
      console.log('Send message error:', error.message);
    }
  }, [myConversation]);

  // Mark conversation as read by admin
  const markReadByAdmin = useCallback(async (conversationId) => {
    try {
      await api.put(`/chat/read/${conversationId}`);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadByAdmin: 0 } : conv
        )
      );
    } catch (error) {
      // Ignore
    }
  }, []);

  // Delete conversation (admin)
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      const res = await api.delete(`/chat/${conversationId}`);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      }
      return res;
    } catch (error) {
      throw error;
    }
  }, []);

  // Mark conversation as read by user
  const markReadByUser = useCallback(async (conversationId) => {
    if (conversationId === 'temp') return;
    try {
      await api.put(`/chat/read/${conversationId}`);
      setMyConversation((prev) => prev ? { ...prev, unreadByUser: 0 } : prev);
    } catch (error) {
      // Ignore
    }
  }, []);

  // Get messages for a conversation
  const getMessages = useCallback((conversationId) => {
    if (myConversation && myConversation.id === conversationId) {
      return myConversation.messages || [];
    }
    const conv = conversations.find((c) => c.id === conversationId);
    return conv?.messages || [];
  }, [conversations, myConversation]);

  // Get conversation for a specific user
  const getUserConversation = useCallback((userId) => {
    if (myConversation && myConversation.userId === userId) {
      return myConversation;
    }
    return conversations.find((c) => c.userId === userId);
  }, [conversations, myConversation]);

  // Total unread count for admin badge
  const totalUnreadForAdmin = conversations.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);

  // Total unread count for user
  const getUserUnread = useCallback((userId) => {
    if (myConversation && myConversation.userId === userId) {
      return myConversation.unreadByUser || 0;
    }
    const conv = conversations.find((c) => c.userId === userId);
    return conv?.unreadByUser || 0;
  }, [conversations, myConversation]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchMyConversation();
      fetchConversations();
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMyConversation, fetchConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        getOrCreateConversation,
        sendMessage,
        markReadByAdmin,
        markReadByUser,
        getMessages,
        getUserConversation,
        totalUnreadForAdmin,
        getUserUnread,
        fetchConversations,
        fetchMyConversation,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
