import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CourseContext';
import { CourseCard } from '../../components/CourseComponents';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../theme/theme';

const ExploreScreen = ({ navigation, route }) => {
  const { courses, categories } = useCourses();
  const { user } = useAuth();
  const mode = route.params?.mode;
  
  const enrolledCoursesList = (user?.enrolledCourses || [])
    .map(courseOrId => {
      if (typeof courseOrId === 'string' || !courseOrId.title) {
        return courses.find(c => (c._id || c.id) === (courseOrId._id || courseOrId.id || courseOrId));
      }
      return courseOrId;
    })
    .filter(Boolean);

  const initialCategory = route.params?.category || 'All';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const filteredCourses = useMemo(() => {
    let filtered = mode === 'enrolled' ? enrolledCoursesList : courses;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => 
        (c.title && c.title.toLowerCase().includes(q)) || 
        (c.instructor && c.instructor.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [courses, selectedCategory, searchQuery]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{mode === 'enrolled' ? 'Continue Learning' : 'Explore Courses'}</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for courses..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={['All', ...categories]}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(item)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === item && styles.categoryTextActive
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item, index }) => (
          <View style={styles.cardWrapper}>
            <CourseCard
              course={item}
              onPress={() => navigation.navigate('CourseDetail', { courseId: item._id || item.id })}
              index={index}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No courses found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 50,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  categoryScroll: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  categoryChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: SPACING.xxl * 2,
  },
  cardWrapper: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
  },
});

export default ExploreScreen;
