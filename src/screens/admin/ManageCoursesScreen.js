import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  Image,
  TextInput,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { useCourses } from '../../context/CourseContext';

const { width } = Dimensions.get('window');

// Cross-platform alert
const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && buttons.length > 1) {
      const okButton = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];
      okButton?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const AnimatedCourseCard = ({ course, index, onEdit, onDelete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 80;
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const difficultyConfig = {
    Beginner: { color: COLORS.accent, icon: 'leaf' },
    Intermediate: { color: COLORS.warning, icon: 'flame' },
    Advanced: { color: COLORS.error, icon: 'rocket' },
  };

  const diffInfo = difficultyConfig[course.difficulty] || difficultyConfig.Beginner;

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onEdit(course)}
      >
        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          {course.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} style={styles.thumb} />
          ) : (
            <LinearGradient
              colors={COLORS.gradientCard}
              style={styles.thumb}
            >
              <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
            </LinearGradient>
          )}
          {course.difficulty && (
            <View style={[styles.diffBadge, { backgroundColor: diffInfo.color }]}>
              <Ionicons name={diffInfo.icon} size={10} color={COLORS.white} />
              <Text style={styles.diffBadgeText}>{course.difficulty}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {course.title || 'Untitled Course'}
          </Text>
          <View style={styles.cardInstructorRow}>
            <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.cardInstructor} numberOfLines={1}>
              {course.instructor || 'Unknown'}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            {course.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{course.category}</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.enrolledWrap}>
              <Ionicons name="people" size={13} color={COLORS.textMuted} />
              <Text style={styles.enrolledText}>
                {course.enrolledCount || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onEdit(course)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(course)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ManageCoursesScreen = ({ navigation }) => {
  const { courses, loading, deleteCourse, searchCourses } = useCourses();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [listKey, setListKey] = useState(0);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(searchAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredCourses = searchQuery.trim()
    ? searchCourses(searchQuery.trim())
    : courses;

  const handleEdit = useCallback(
    (course) => {
      navigation.navigate('AddCourse', { course: { ...course, createdAt: course.createdAt?.toString?.() || null, updatedAt: course.updatedAt?.toString?.() || null } });
    },
    [navigation]
  );

  const handleDelete = useCallback(
    (course) => {
      showAlert(
        'Delete Course',
        `Are you sure you want to delete "${course.title || 'this course'}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const result = await deleteCourse(course.id);
              if (result.success) {
                showAlert('Deleted', 'Course has been removed successfully.');
              } else {
                showAlert('Error', result.error || 'Failed to delete course.');
              }
            },
          },
        ]
      );
    },
    [deleteCourse]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setListKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <AnimatedCourseCard
        course={item}
        index={index}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [handleEdit, handleDelete]
  );

  const keyExtractor = useCallback((item) => item.id || Math.random().toString(), []);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="school-outline" size={64} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? 'No Results Found' : 'No Courses Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery.trim()
          ? `No courses match "${searchQuery}". Try a different search term.`
          : 'Start building your library by adding your first course.'}
      </Text>
      {!searchQuery.trim() && (
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={() => navigation.navigate('AddCourse')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyActionGradient}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
            <Text style={styles.emptyActionText}>Add First Course</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Courses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddCourse')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={COLORS.gradientPrimary}
            style={styles.addBtnGradient}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchWrap,
          {
            opacity: searchAnim,
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search courses..."
            placeholderTextColor={COLORS.textPlaceholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.resultCount}>
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
        </Text>
      </Animated.View>

      {/* Course List */}
      <FlatList
        key={listKey}
        data={filteredCourses}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.surface}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.huge,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  addBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search
  searchWrap: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
    paddingVertical: 0,
  },
  resultCount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  // List
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.huge,
    flexGrow: 1,
  },
  // Card
  cardOuter: {
    marginBottom: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 100,
    height: '100%',
    minHeight: 110,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    gap: 3,
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  cardInstructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cardInstructor: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primaryLight,
  },
  enrolledWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  enrolledText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMuted,
  },
  // Action Buttons
  cardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.huge * 2,
    paddingHorizontal: SPACING.xxxl,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  emptyAction: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyActionText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default ManageCoursesScreen;
