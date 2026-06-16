import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../context/ChatContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';

const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const ConversationCard = ({ conversation, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);

  const firstLetter = (conversation.userName || 'S').charAt(0).toUpperCase();
  const hasUnread = conversation.unreadByAdmin > 0;

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        onPress={() => onPress(conversation)}
      >
        {/* Avatar */}
        <LinearGradient
          colors={hasUnread ? COLORS.gradientPrimary : COLORS.gradientCard}
          style={styles.avatar}
        >
          <Text style={[styles.avatarText, !hasUnread && { color: COLORS.textMuted }]}>{firstLetter}</Text>
        </LinearGradient>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.userName} numberOfLines={1}>{conversation.userName}</Text>
            <Text style={styles.timeText}>
              {conversation.lastMessageTime ? formatRelativeTime(conversation.lastMessageTime) : ''}
            </Text>
          </View>
          <View style={styles.cardBottomRow}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {conversation.lastMessage || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conversation.unreadByAdmin}</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const AdminChatsScreen = ({ navigation }) => {
  const { conversations } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);

  const handlePress = useCallback((conv) => {
    navigation.navigate('AdminChatDetail', { conversationId: conv.id, userName: conv.userName });
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => <ConversationCard conversation={item} index={index} onPress={handlePress} />,
    [handlePress]
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="chatbubbles-outline" size={56} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptySubtitle}>
        Student messages will appear here. You'll be able to respond and provide support.
      </Text>
    </View>
  );

  // Sort conversations: unread first, then by last message time
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.unreadByAdmin && !b.unreadByAdmin) return -1;
    if (!a.unreadByAdmin && b.unreadByAdmin) return 1;
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Messages</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
          <Text style={styles.headerCount}>{conversations.length}</Text>
        </View>
      </Animated.View>

      <FlatList
        data={sortedConversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, sortedConversations.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: SPACING.huge, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  headerCount: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  // List
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  // Card
  cardOuter: { marginBottom: SPACING.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  avatarText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  cardContent: { flex: 1, marginRight: SPACING.sm },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  timeText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, flex: 1, marginRight: SPACING.sm },
  lastMessageUnread: { color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  unreadBadge: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxxl },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  emptyTitle: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: SPACING.sm },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});

export default AdminChatsScreen;
