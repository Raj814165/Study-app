import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { useCourses } from '../../context/CourseContext';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, getToken } from '../../config/api';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  'Mobile Development',
  'Web Development',
  'Data Science',
  'Design',
  'Cloud Computing',
  'Cybersecurity',
  'Programming',
  'Business',
  'Marketing',
  'AI & Machine Learning',
  'DevOps',
  'Photography',
  'Music',
  'Health',
  'Finance',
  'Language',
];

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Upload a picked video file to the backend, returns the server URL
const uploadVideoFile = async (uri) => {
  try {
    const token = await getToken();
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // On web, fetch the blob and append it
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('video', blob, `video-${Date.now()}.mp4`);
    } else {
      // On native, use the file URI
      const filename = uri.split('/').pop() || `video-${Date.now()}.mp4`;
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : 'video/mp4';
      formData.append('video', { uri, name: filename, type });
    }

    const res = await fetch(`${API_BASE_URL}/upload/video`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
    throw new Error(data.error || 'Upload failed');
  } catch (e) {
    console.log('Video upload error:', e);
    throw e;
  }
};

// Cross-platform alert that works on web too
const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && buttons.length > 1) {
      const okButton = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];
      okButton?.onPress?.();
    } else if (!result && buttons.length > 1) {
      const cancelButton = buttons.find(b => b.style === 'cancel');
      cancelButton?.onPress?.();
    } else if (buttons.length === 1) {
      buttons[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const AddCourseScreen = ({ navigation, route }) => {
  const editCourse = route?.params?.course || null;
  const isEditing = !!editCourse;

  const { addCourse, updateCourse } = useCourses();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [duration, setDuration] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [lessons, setLessons] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Populate for editing
  useEffect(() => {
    if (editCourse) {
      setTitle(editCourse.title || '');
      setDescription(editCourse.description || '');
      setInstructor(editCourse.instructor || '');
      setCategory(editCourse.category || '');
      setVideoUrl(editCourse.videoUrl || '');
      setThumbnail(editCourse.thumbnail || '');
      setDuration(editCourse.duration || '');
      setDifficulty(editCourse.difficulty || 'Beginner');
      // Ensure lessons have IDs
      const lessonsWithIds = (editCourse.lessons || []).map((l, i) => ({
        ...l,
        id: l.id || `lesson-${Date.now()}-${i}`,
      }));
      setLessons(lessonsWithIds);
      
      // Check if category is custom
      if (editCourse.category && !CATEGORIES.includes(editCourse.category)) {
        setShowCustomCategory(true);
        setCustomCategory(editCourse.category);
        setCategory('__custom__');
      }
    }
  }, [editCourse]);

  const addLesson = () => {
    setLessons((prev) => [
      ...prev,
      { id: `lesson-${Date.now()}`, title: '', videoUrl: '', duration: '' },
    ]);
  };

  const removeLesson = (lessonId) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const updateLesson = (lessonId, field, value) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, [field]: value } : l))
    );
  };

  const validateForm = () => {
    if (!title.trim()) {
      showAlert('Required Field', 'Please enter a course title.');
      return false;
    }
    if (!description.trim()) {
      showAlert('Required Field', 'Please enter a course description.');
      return false;
    }
    if (!instructor.trim()) {
      showAlert('Required Field', 'Please enter the instructor name.');
      return false;
    }
    const finalCategory = category === '__custom__' ? customCategory.trim() : category;
    if (!finalCategory) {
      showAlert('Required Field', 'Please select or enter a category.');
      return false;
    }
    return true;
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    Animated.spring(successAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const hideSuccess = () => {
    Animated.timing(successAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
      navigation.goBack();
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructor('');
    setCategory('');
    setCustomCategory('');
    setShowCustomCategory(false);
    setVideoUrl('');
    setThumbnail('');
    setDuration('');
    setDifficulty('Beginner');
    setLessons([]);
    setThumbnailError(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    const finalCategory = category === '__custom__' ? customCategory.trim() : category;

    const courseData = {
      title: title.trim(),
      description: description.trim(),
      instructor: instructor.trim(),
      category: finalCategory,
      videoUrl: videoUrl.trim(),
      thumbnail: thumbnail.trim(),
      duration: duration.trim(),
      difficulty,
      lessons: lessons
        .filter((l) => l.title.trim())
        .map((l) => ({
          title: l.title.trim(),
          videoUrl: l.videoUrl?.trim() || '',
          duration: l.duration?.trim() || '',
        })),
    };

    let result;
    if (isEditing) {
      result = await updateCourse(editCourse.id, courseData);
    } else {
      result = await addCourse(courseData);
    }

    setSubmitting(false);

    if (result.success) {
      showSuccess(
        isEditing ? 'Course updated successfully!' : 'Course created successfully!'
      );
    } else {
      showAlert('Error', result.error || 'Something went wrong. Please try again.');
    }
  };

  const renderInput = (label, value, setValue, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {options.required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <View style={[styles.inputWrap, options.multiline && styles.inputWrapMultiline]}>
        {options.icon && (
          <Ionicons
            name={options.icon}
            size={18}
            color={COLORS.textMuted}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            options.icon && styles.inputWithIcon,
            options.multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={setValue}
          placeholder={options.placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.textPlaceholder}
          multiline={options.multiline || false}
          numberOfLines={options.multiline ? 4 : 1}
          textAlignVertical={options.multiline ? 'top' : 'center'}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'sentences'}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Course' : 'Add New Course'}
          </Text>
          {isEditing && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetForm}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          {!isEditing && <View style={styles.headerSpacer} />}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Title */}
            {renderInput('Course Title', title, setTitle, {
              icon: 'book-outline',
              placeholder: 'e.g. Advanced React Native',
              required: true,
            })}

            {/* Description */}
            {renderInput('Description', description, setDescription, {
              icon: 'document-text-outline',
              placeholder: 'Describe what students will learn in this course...',
              multiline: true,
              required: true,
            })}

            {/* Instructor */}
            {renderInput('Instructor Name', instructor, setInstructor, {
              icon: 'person-outline',
              placeholder: 'e.g. Sarah Johnson',
              required: true,
            })}

            {/* Category Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Category<Text style={styles.requiredStar}> *</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScrollContent}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCustomCategory(false);
                    }}
                    activeOpacity={0.7}
                  >
                    {category === cat ? (
                      <LinearGradient
                        colors={COLORS.gradientPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.categoryChipGradient}
                      >
                        <Text style={styles.categoryChipTextActive}>{cat}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={styles.categoryChipText}>{cat}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {/* Custom category option */}
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    category === '__custom__' && styles.categoryChipActive,
                  ]}
                  onPress={() => {
                    setCategory('__custom__');
                    setShowCustomCategory(true);
                  }}
                  activeOpacity={0.7}
                >
                  {category === '__custom__' ? (
                    <LinearGradient
                      colors={COLORS.gradientAccent}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.categoryChipGradient}
                    >
                      <Ionicons name="add" size={14} color={COLORS.white} />
                      <Text style={styles.categoryChipTextActive}> Custom</Text>
                    </LinearGradient>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2 }}>
                      <Ionicons name="add" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.categoryChipText}> Custom</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </ScrollView>
              {showCustomCategory && (
                <View style={[styles.inputWrap, { marginTop: SPACING.sm }]}>
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color={COLORS.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    placeholder="Enter custom category name"
                    placeholderTextColor={COLORS.textPlaceholder}
                  />
                </View>
              )}
            </View>

            {/* Thumbnail URL */}
            {renderInput('Thumbnail URL', thumbnail, (val) => {
              setThumbnail(val);
              setThumbnailError(false);
            }, {
              icon: 'image-outline',
              placeholder: 'https://example.com/thumbnail.jpg',
              autoCapitalize: 'none',
              keyboardType: 'url',
            })}

            {/* Thumbnail Preview */}
            {thumbnail.trim() !== '' && !thumbnailError && (
              <View style={styles.thumbnailPreview}>
                <Image
                  source={{ uri: thumbnail.trim() }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                  onError={() => setThumbnailError(true)}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.thumbnailGradientOverlay}
                />
                <View style={styles.thumbnailOverlay}>
                  <Ionicons name="image" size={16} color={COLORS.white} />
                  <Text style={styles.thumbnailLabel}>Preview</Text>
                </View>
              </View>
            )}
            {thumbnail.trim() !== '' && thumbnailError && (
              <View style={styles.thumbnailErrorBox}>
                <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
                <Text style={styles.thumbnailErrorText}>
                  Unable to load thumbnail preview. Check the URL.
                </Text>
              </View>
            )}

            {/* Video URL + Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Video</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="videocam-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="YouTube or video URL"
                  placeholderTextColor={COLORS.textPlaceholder}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <View style={styles.videoActions}>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  activeOpacity={0.7}
                  onPress={async () => {
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['videos'],
                        allowsEditing: true,
                        quality: 1,
                      });
                      if (!result.canceled && result.assets?.[0]?.uri) {
                        setVideoUrl('Uploading...');
                        try {
                          const serverUrl = await uploadVideoFile(result.assets[0].uri);
                          setVideoUrl(serverUrl);
                        } catch (uploadErr) {
                          setVideoUrl('');
                          showAlert('Upload Failed', 'Could not upload video. Please paste a YouTube URL instead.');
                        }
                      }
                    } catch (e) {
                      console.log('Video pick error:', e);
                    }
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.uploadBtnText}>Upload Video</Text>
                </TouchableOpacity>
                {videoUrl.trim() !== '' && (
                  <View style={styles.videoUrlPreview}>
                    <Ionicons
                      name={videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? 'logo-youtube' : 'checkmark-circle'}
                      size={14}
                      color={videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? '#FF0000' : COLORS.success}
                    />
                    <Text style={styles.videoUrlPreviewText} numberOfLines={1}>
                      {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? 'YouTube video linked' : 'Video file linked'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Duration */}
            {renderInput('Duration', duration, setDuration, {
              icon: 'time-outline',
              placeholder: 'e.g. 12h 30m',
            })}

            {/* Difficulty Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Difficulty Level</Text>
              <View style={styles.difficultyRow}>
                {DIFFICULTY_LEVELS.map((level) => {
                  const isActive = difficulty === level;
                  const levelColors = {
                    Beginner: COLORS.gradientAccent,
                    Intermediate: COLORS.gradientSunset,
                    Advanced: COLORS.gradientRose,
                  };
                  const levelIcons = {
                    Beginner: isActive ? 'leaf' : 'leaf-outline',
                    Intermediate: isActive ? 'flame' : 'flame-outline',
                    Advanced: isActive ? 'rocket' : 'rocket-outline',
                  };
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyChip,
                        isActive && styles.difficultyChipActive,
                      ]}
                      onPress={() => setDifficulty(level)}
                      activeOpacity={0.7}
                    >
                      {isActive ? (
                        <LinearGradient
                          colors={levelColors[level]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.difficultyChipGradient}
                        >
                          <Ionicons name={levelIcons[level]} size={14} color={COLORS.white} />
                          <Text style={styles.difficultyTextActive}>{level}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.difficultyChipInner}>
                          <Ionicons name={levelIcons[level]} size={14} color={COLORS.textMuted} />
                          <Text style={styles.difficultyText}>{level}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Lessons Section */}
            <View style={styles.inputGroup}>
              <View style={styles.lessonsHeader}>
                <View>
                  <Text style={styles.inputLabel}>Course Lessons</Text>
                  <Text style={styles.lessonsCount}>
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} added
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addLessonBtn}
                  onPress={addLesson}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={COLORS.gradientPrimary}
                    style={styles.addLessonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="add" size={18} color={COLORS.white} />
                    <Text style={styles.addLessonText}>Add Lesson</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {lessons.length === 0 && (
                <TouchableOpacity
                  style={styles.noLessons}
                  onPress={addLesson}
                  activeOpacity={0.8}
                >
                  <Ionicons name="list-outline" size={32} color={COLORS.textMuted} />
                  <Text style={styles.noLessonsText}>No lessons added yet</Text>
                  <Text style={styles.noLessonsSubtext}>
                    Tap here or "Add Lesson" to add course content
                  </Text>
                </TouchableOpacity>
              )}

              {lessons.map((lesson, index) => (
                <View key={lesson.id} style={styles.lessonCard}>
                  <View style={styles.lessonHeader}>
                    <LinearGradient
                      colors={COLORS.gradientPrimary}
                      style={styles.lessonNumber}
                    >
                      <Text style={styles.lessonNumberText}>{index + 1}</Text>
                    </LinearGradient>
                    <Text style={styles.lessonLabel}>Lesson {index + 1}</Text>
                    <TouchableOpacity
                      style={styles.removeLessonBtn}
                      onPress={() => removeLesson(lesson.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.lessonInput}
                    value={lesson.title}
                    onChangeText={(val) => updateLesson(lesson.id, 'title', val)}
                    placeholder="Lesson title"
                    placeholderTextColor={COLORS.textPlaceholder}
                  />
                  <View style={styles.lessonRow}>
                    <View style={[styles.lessonVideoInput, { flex: 1 }]}>
                      <Ionicons name="videocam-outline" size={14} color={COLORS.textMuted} style={{ marginLeft: SPACING.md }} />
                      <TextInput
                        style={[styles.lessonInput, styles.lessonInputInline, { marginBottom: 0 }]}
                        value={lesson.videoUrl}
                        onChangeText={(val) => updateLesson(lesson.id, 'videoUrl', val)}
                        placeholder="YouTube or video URL"
                        placeholderTextColor={COLORS.textPlaceholder}
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.lessonUploadBtn}
                      activeOpacity={0.7}
                      onPress={async () => {
                        try {
                          const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['videos'],
                            allowsEditing: true,
                            quality: 1,
                          });
                          if (!result.canceled && result.assets?.[0]?.uri) {
                            updateLesson(lesson.id, 'videoUrl', 'Uploading...');
                            try {
                              const serverUrl = await uploadVideoFile(result.assets[0].uri);
                              updateLesson(lesson.id, 'videoUrl', serverUrl);
                            } catch (uploadErr) {
                              updateLesson(lesson.id, 'videoUrl', '');
                              showAlert('Upload Failed', 'Could not upload video. Please paste a YouTube URL instead.');
                            }
                          }
                        } catch (e) {
                          console.log('Video pick error:', e);
                        }
                      }}
                    >
                      <Ionicons name="cloud-upload-outline" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.lessonRow}>
                    <View style={styles.lessonDurationInput}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textMuted} style={{ marginLeft: SPACING.md }} />
                      <TextInput
                        style={[styles.lessonInput, styles.lessonInputInline, { marginBottom: 0 }]}
                        value={lesson.duration}
                        onChangeText={(val) => updateLesson(lesson.id, 'duration', val)}
                        placeholder="Duration"
                        placeholderTextColor={COLORS.textPlaceholder}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              <LinearGradient
                colors={submitting ? [COLORS.surfaceLight, COLORS.surfaceLight] : COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name={isEditing ? 'checkmark-circle' : 'cloud-upload'}
                      size={22}
                      color={COLORS.white}
                    />
                    <Text style={styles.submitText}>
                      {isEditing ? 'Update Course' : 'Create Course'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={hideSuccess}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModal,
              {
                transform: [
                  { scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                ],
                opacity: successAnim,
              },
            ]}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.successIconBg}
            >
              <Ionicons name="checkmark-circle" size={48} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.successTitle}>
              {isEditing ? 'Course Updated!' : 'Course Created!'}
            </Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={hideSuccess}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={COLORS.gradientPrimary}
                style={styles.successButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.successButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
  flex: {
    flex: 1,
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
  headerSpacer: {
    width: 40,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  // Input Groups
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  requiredStar: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputWrapMultiline: {
    minHeight: 120,
  },
  inputIcon: {
    marginLeft: SPACING.lg,
    marginTop: SPACING.lg,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  inputWithIcon: {
    paddingLeft: SPACING.sm,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: SPACING.lg,
    textAlignVertical: 'top',
  },
  // Category Chips
  chipScrollContent: {
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  categoryChip: {
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
    borderWidth: 0,
  },
  categoryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  categoryChipTextActive: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  // Difficulty
  difficultyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  difficultyChip: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  difficultyChipActive: {
    borderWidth: 0,
  },
  difficultyChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  difficultyChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  difficultyText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMuted,
  },
  difficultyTextActive: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  // Thumbnail Preview
  thumbnailPreview: {
    marginTop: -SPACING.md,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    height: 180,
    ...SHADOWS.medium,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  thumbnailLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
  },
  thumbnailErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 203, 110, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: -SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  thumbnailErrorText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.warning,
    flex: 1,
  },
  // Lessons
  lessonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  lessonsCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addLessonBtn: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  addLessonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  addLessonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  noLessons: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
  },
  noLessonsText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  noLessonsSubtext: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  lessonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  lessonNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  lessonNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  lessonLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  removeLessonBtn: {
    padding: SPACING.xs,
  },
  lessonInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  lessonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  lessonVideoInput: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  lessonDurationInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  lessonInputInline: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.sm,
  },
  // Submit Button
  submitButton: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg + 2,
    gap: SPACING.sm,
  },
  submitText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: SPACING.huge,
  },
  // Video upload
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  uploadBtnText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  videoUrlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  videoUrlPreviewText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
    maxWidth: 150,
  },
  lessonUploadBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successModal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  successButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  successButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default AddCourseScreen;
