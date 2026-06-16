import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCourses } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 320;

const CourseDetailScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const { getCourseById } = useCourses();
  const { user, enrollInCourse } = useAuth();
  const course = getCourseById(courseId);

  const [isEnrolling, setIsEnrolling] = useState(false);

  const [descExpanded, setDescExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const lessonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(contentAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.spring(lessonsAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  }, []);

  if (!course) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
    outputRange: [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  const getDifficultyColor = (difficulty) => {
    const map = {
      Beginner: COLORS.success,
      Intermediate: COLORS.warning,
      Advanced: COLORS.error,
    };
    return map[difficulty] || COLORS.primary;
  };

  const renderStars = (rating = 0) => {
    const stars = [];
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<Ionicons key={i} name="star" size={16} color={COLORS.warning} />);
      } else if (i === full && half) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color={COLORS.warning} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color={COLORS.textMuted} />);
      }
    }
    return stars;
  };

  const lessons = course.lessons || [];
  const description = course.description || 'No description available for this course.';
  const shouldTruncate = description.length > 200;
  const displayDescription = descExpanded || !shouldTruncate ? description : description.slice(0, 200) + '...';

  const diffColor = getDifficultyColor(course.difficulty);

  const isEnrolled = user?.enrolledCourses?.some(c => c.id === courseId || c === courseId);

  const handleEnrollOrStart = async () => {
    if (isEnrolled) {
      if (lessons.length > 0) {
        navigation.navigate('VideoPlayer', {
          videoUrl: lessons[0].videoUrl || '',
          lessonTitle: lessons[0].title || 'Lesson 1',
        });
      }
    } else {
      setIsEnrolling(true);
      const res = await enrollInCourse(courseId);
      setIsEnrolling(false);
      if (!res.success) {
        Alert.alert('Error', res.error || 'Failed to enroll');
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Parallax Header */}
        <Animated.View style={[styles.headerContainer, { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }]}>
          <Image
            source={{ uri: course.thumbnail || 'https://via.placeholder.com/400x320/13131A/6C5CE7?text=Course' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.7)', COLORS.background]}
            style={styles.headerGradient}
          />
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          {/* Title & Meta */}
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.instructor}>by {course.instructor || 'Unknown Instructor'}</Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <View style={styles.starsRow}>{renderStars(course.rating)}</View>
            <Text style={styles.ratingValue}>{(course.rating || 0).toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({course.reviewCount || 0} reviews)</Text>
          </View>

          {/* Meta Badges */}
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: diffColor + '20', borderColor: diffColor + '50' }]}>
              <View style={[styles.badgeDot, { backgroundColor: diffColor }]} />
              <Text style={[styles.badgeText, { color: diffColor }]}>{course.difficulty || 'General'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{course.enrolledCount || 0} enrolled</Text>
            </View>

            {course.duration && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{course.duration}</Text>
              </View>
            )}
          </View>

          {/* Start Course Button */}
          <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={handleEnrollOrStart} disabled={isEnrolling}>
            <LinearGradient
              colors={isEnrolled ? ['#10B981', '#059669'] : COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              {isEnrolling ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name={isEnrolled ? 'play-circle' : 'add-circle'} size={24} color={COLORS.white} />
                  <Text style={styles.startButtonText}>
                    {isEnrolled ? (lessons.length > 0 ? 'Start Course' : 'Enrolled') : 'Enroll Now'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Course</Text>
            <Text style={styles.descriptionText}>{displayDescription}</Text>
            {shouldTruncate && (
              <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} style={styles.expandButton}>
                <Text style={styles.expandText}>{descExpanded ? 'Show Less' : 'Show More'}</Text>
                <Ionicons
                  name={descExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Lessons */}
          {lessons.length > 0 && (
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: lessonsAnim,
                  transform: [{
                    translateY: lessonsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.lessonHeader}>
                <Text style={styles.sectionTitle}>Lessons</Text>
                <Text style={styles.lessonCount}>{lessons.length} lessons</Text>
              </View>

              {isEnrolled ? (
                lessons.map((lesson, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.lessonItem}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('VideoPlayer', {
                        videoUrl: lesson.videoUrl || '',
                        lessonTitle: lesson.title || `Lesson ${index + 1}`,
                      })
                    }
                  >
                    <View style={styles.lessonNumber}>
                      <Text style={styles.lessonNumberText}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle} numberOfLines={1}>
                        {lesson.title || `Lesson ${index + 1}`}
                      </Text>
                      {lesson.duration && (
                        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                      )}
                    </View>
                    <View style={styles.playIconContainer}>
                      <Ionicons name="play-circle-outline" size={28} color={COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.lockedContainer}>
                  <Ionicons name="lock-closed" size={48} color={COLORS.textMuted} />
                  <Text style={styles.lockedText}>Enroll in this course to unlock {lessons.length} lessons.</Text>
                </View>
              )}
            </Animated.View>
          )}

          {lessons.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lessons</Text>
              <View style={styles.emptyLessons}>
                <Ionicons name="videocam-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyLessonsText}>Lessons coming soon</Text>
              </View>
            </View>
          )}

          <View style={{ height: SPACING.huge * 2 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <View style={styles.backButtonInner}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  // Header
  headerContainer: {
    height: HEADER_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
  },
  // Back Button
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.xl,
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  // Content
  content: {
    marginTop: -SPACING.huge,
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  instructor: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
    marginBottom: SPACING.md,
  },
  // Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.warning,
  },
  reviewCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  // Start Button
  startButton: {
    marginBottom: SPACING.xxl,
    ...SHADOWS.large,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  startButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  // Section
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  descriptionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  expandText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  // Lessons
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  lessonCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  lessonNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  lessonNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  lessonDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  playIconContainer: {
    marginLeft: SPACING.sm,
  },
  // Empty Lessons
  emptyLessons: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyLessonsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
    marginTop: SPACING.md,
  },
  lockedText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
});

export default CourseDetailScreen;
