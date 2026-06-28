import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { useCourses } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { api } from '../../config/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.xl * 2 - SPACING.md) / 2;

const AdminDashboard = ({ navigation }) => {
  const { courses, categories, loading } = useCourses();
  const { user, isAdmin } = useAuth();
  const { conversations, totalUnreadForAdmin } = useChat();

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const recentAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  // Broadcast announcement state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  useEffect(() => {
    const stagger = Animated.stagger(120, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      ...statsAnim.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        })
      ),
      Animated.spring(actionsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(recentAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      ...itemAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        })
      ),
    ]);
    stagger.start();
  }, []);

  const totalStudents = useMemo(() => {
    return courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  }, [courses]);

  const recentCourses = useMemo(() => {
    return courses.slice(0, 5);
  }, [courses]);

  const statsData = [
    {
      title: 'Total Courses',
      value: courses.length,
      icon: 'book',
      gradient: COLORS.gradientPrimary,
    },
    {
      title: 'Total Students',
      value: totalStudents,
      icon: 'people',
      gradient: COLORS.gradientAccent,
    },
    {
      title: 'Categories',
      value: categories.length,
      icon: 'grid',
      gradient: COLORS.gradientSunset,
    },
  ];

  const quickActions = [
    {
      title: 'Add New Course',
      icon: 'add-circle',
      screen: 'AddCourse',
      gradient: COLORS.gradientPrimary,
    },
    {
      title: 'Manage Courses',
      icon: 'settings',
      screen: 'ManageCourses',
      gradient: COLORS.gradientHero,
    },
    {
      title: 'Student Messages',
      icon: 'chatbubbles',
      screen: 'AdminChats',
      gradient: COLORS.gradientAccent,
      badge: totalUnreadForAdmin,
    },
    {
      title: 'Send Announcement',
      icon: 'megaphone',
      screen: null,
      gradient: COLORS.gradientSunset,
      onPress: () => setShowBroadcastModal(true),
    },
  ];

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      Alert.alert('Missing Info', 'Please enter both a title and message.');
      return;
    }

    setBroadcastSending(true);
    try {
      const data = await api.post('/notifications/broadcast', {
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
      });

      if (data.success) {
        Alert.alert(
          '✅ Sent!',
          data.message || 'Notification sent to all users.',
          [{ text: 'OK' }]
        );
        setBroadcastTitle('');
        setBroadcastBody('');
        setShowBroadcastModal(false);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send notification.');
    } finally {
      setBroadcastSending(false);
    }
  };

  const renderStatCard = (stat, index) => {
    const animValue = statsAnim[index];
    return (
      <Animated.View
        key={stat.title}
        style={[
          styles.statCard,
          {
            opacity: animValue,
            transform: [
              { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
              { scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={stat.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statGradient}
        >
          <View style={styles.statIconWrap}>
            <Ionicons name={stat.icon} size={22} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statTitle}>{stat.title}</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderQuickAction = (action, index) => (
    <TouchableOpacity
      key={action.title}
      style={styles.actionButton}
      activeOpacity={0.8}
      onPress={() => action.onPress ? action.onPress() : navigation.navigate(action.screen)}
    >
      <LinearGradient
        colors={action.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.actionGradient}
      >
        <View style={styles.actionIconWrap}>
          <Ionicons name={action.icon} size={24} color={COLORS.white} />
        </View>
        <Text style={styles.actionText}>{action.title}</Text>
        <View style={styles.actionRightWrap}>
          {action.badge > 0 && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{action.badge}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRecentCourse = (course, index) => {
    const animValue = itemAnims[index] || new Animated.Value(1);
    return (
      <Animated.View
        key={course.id || course._id || index}
        style={[
          styles.recentCard,
          {
            opacity: animValue,
            transform: [
              { translateX: animValue.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.recentCardInner}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AddCourse', { course: { ...course, createdAt: course.createdAt?.toString?.() || null, updatedAt: course.updatedAt?.toString?.() || null } })}
        >
          {course.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} style={styles.recentThumb} />
          ) : (
            <LinearGradient
              colors={COLORS.gradientCard}
              style={styles.recentThumb}
            >
              <Ionicons name="image-outline" size={20} color={COLORS.textMuted} />
            </LinearGradient>
          )}
          <View style={styles.recentInfo}>
            <Text style={styles.recentTitle} numberOfLines={1}>
              {course.title || 'Untitled Course'}
            </Text>
            <Text style={styles.recentMeta} numberOfLines={1}>
              {course.instructor || 'Unknown Instructor'}
            </Text>
            <View style={styles.recentBadgeRow}>
              {course.category ? (
                <View style={styles.recentBadge}>
                  <Text style={styles.recentBadgeText}>{course.category}</Text>
                </View>
              ) : null}
              <Text style={styles.recentEnrolled}>
                <Ionicons name="people-outline" size={11} color={COLORS.textMuted} />{' '}
                {course.enrolledCount || 0}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header */}
        <Animated.View
          style={[
            styles.headerWrap,
            {
              opacity: headerAnim,
              transform: [
                { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={COLORS.gradientHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerOverlay} />
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
              <Text style={styles.exitButtonText}>Exit Admin</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerGreeting}>Welcome back,</Text>
                <Text style={styles.headerName}>
                  {user?.displayName || 'Admin'}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.white} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              </View>
            </View>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>
              Manage your courses, students, and content
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          {statsData.map(renderStatCard)}
        </View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: actionsAnim,
              transform: [
                { translateY: actionsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map(renderQuickAction)}
        </Animated.View>

        {/* Recent Courses */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: recentAnim,
              transform: [
                { translateY: recentAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Courses</Text>
            {courses.length > 5 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ManageCourses')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No courses yet</Text>
              <Text style={styles.emptySubtext}>
                Start by adding your first course
              </Text>
            </View>
          ) : (
            recentCourses.map(renderRecentCourse)
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Broadcast Announcement Modal */}
      <Modal
        visible={showBroadcastModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBroadcastModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={COLORS.gradientSunset}
                style={styles.modalIconWrap}
              >
                <Ionicons name="megaphone" size={22} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.modalTitle}>Send Announcement</Text>
              <Text style={styles.modalSubtitle}>
                This notification will be sent to all users
              </Text>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
                placeholder="e.g. Class Started!"
                placeholderTextColor={COLORS.textPlaceholder}
                maxLength={100}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Message</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={broadcastBody}
                onChangeText={setBroadcastBody}
                placeholder="e.g. Join the live class now!"
                placeholderTextColor={COLORS.textPlaceholder}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            <View style={styles.modalQuickTags}>
              <Text style={styles.modalLabel}>Quick Templates</Text>
              <View style={styles.modalTagRow}>
                {[
                  { title: '🎓 Class Started!', body: 'Your live class has started. Join now!' },
                  { title: '📚 New Batch!', body: 'A new batch is now available. Check it out!' },
                  { title: '📢 Important Update', body: 'Please check the app for an important update.' },
                ].map((tpl) => (
                  <TouchableOpacity
                    key={tpl.title}
                    style={styles.modalTag}
                    activeOpacity={0.7}
                    onPress={() => {
                      setBroadcastTitle(tpl.title);
                      setBroadcastBody(tpl.body);
                    }}
                  >
                    <Text style={styles.modalTagText}>{tpl.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowBroadcastModal(false);
                  setBroadcastTitle('');
                  setBroadcastBody('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSendBtn, broadcastSending && styles.modalSendBtnDisabled]}
                onPress={handleBroadcast}
                disabled={broadcastSending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={COLORS.gradientSunset}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSendGradient}
                >
                  <Ionicons name={broadcastSending ? 'hourglass' : 'send'} size={16} color={COLORS.white} />
                  <Text style={styles.modalSendText}>
                    {broadcastSending ? 'Sending...' : 'Send to All'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.huge,
  },
  // Header
  headerWrap: {
    marginBottom: SPACING.xl,
  },
  header: {
    paddingTop: SPACING.huge + SPACING.lg,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerLeft: {},
  headerRight: {},
  headerGreeting: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: 'rgba(255,255,255,0.75)',
  },
  headerName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
  },
  adminBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  statGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.white,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  // Sections
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  seeAllText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  // Quick Actions
  actionButton: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg + 2,
    paddingHorizontal: SPACING.xl,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  actionText: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
  },
  actionRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  // Recent Courses
  recentCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  recentCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  recentThumb: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  recentInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  recentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  recentMeta: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  recentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recentBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  recentBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
  },
  recentEnrolled: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textMuted,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.huge,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  bottomSpacer: {
    height: SPACING.xxxl,
  },
  // Broadcast Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.large,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: SPACING.lg,
  },
  modalLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  modalQuickTags: {
    marginBottom: SPACING.xxl,
  },
  modalTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modalTag: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
  },
  modalSendBtn: {
    flex: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  modalSendBtnDisabled: {
    opacity: 0.6,
  },
  modalSendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  modalSendText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default AdminDashboard;
