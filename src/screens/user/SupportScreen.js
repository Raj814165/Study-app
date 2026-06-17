import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const SupportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    // Simulate API call to support ticket service
    setTimeout(() => {
      const generatedId = `SH-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedId);
      setSubmitting(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
    }, 1500);
  };

  const faqs = [
    {
      question: 'How do I access my enrolled courses?',
      answer: 'Go to your Home or Explore tab, and you will find your courses. Tapping any course opens the lessons list where you can watch videos.',
    },
    {
      question: 'Can I watch videos offline?',
      answer: 'Offline video playback is not supported yet, but you can configure your Download Settings in your profile for optimal video streaming.',
    },
    {
      question: 'How do I change my profile information?',
      answer: 'Go to your Profile tab and tap on "Edit Profile". You can change your display name there.',
    },
    {
      question: 'Who should I contact for billing issues?',
      answer: 'Please fill out the Support Ticket form below or email us directly at billing@studyhub.com with your transaction details.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Support Greeting Card */}
          <LinearGradient
            colors={COLORS.gradientPrimary || ['#6C5CE7', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Ionicons name="help-buoy" size={48} color="#FFFFFF" style={{ marginBottom: 12 }} />
            <Text style={styles.heroTitle}>How can we help you?</Text>
            <Text style={styles.heroSubtitle}>
              Have questions or feedback? Browse our FAQs below or contact our support team.
            </Text>
            <View style={styles.contactEmailRow}>
              <Ionicons name="mail" size={16} color="#FFFFFF" />
              <Text style={styles.contactEmailText}>support@studyhub.com</Text>
            </View>
          </LinearGradient>

          {/* FAQ Section */}
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </View>

          {/* Ticket Submission Form */}
          <Text style={styles.sectionTitle}>Submit a Support Ticket</Text>
          {submitted ? (
            <View style={styles.successCard}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Ticket Submitted Successfully!</Text>
              <Text style={styles.successText}>
                Your Ticket ID is <Text style={{ fontWeight: 'bold', color: COLORS.text }}>#{ticketId}</Text>. We have sent confirmation to <Text style={{ fontStyle: 'italic' }}>{user?.email || 'your email'}</Text>. Our support team will reach out to you within 24 hours.
              </Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setSubmitted(false)}
              >
                <Text style={styles.resetButtonText}>Submit Another Ticket</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Subject</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="What is your issue about?"
                  placeholderTextColor={COLORS.textMuted}
                  value={subject}
                  onChangeText={setSubject}
                  editable={!submitting}
                />
              </View>

              <Text style={styles.formLabel}>Message Details</Text>
              <View style={[styles.inputWrapper, styles.multilineInputWrapper]}>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Describe your issue or question in detail..."
                  placeholderTextColor={COLORS.textMuted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  editable={!submitting}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!subject.trim() || !message.trim() || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!subject.trim() || !message.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Ticket</Text>
                    <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold || '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold || '700',
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  contactEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  contactEmailText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold || '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  faqList: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  faqCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  faqQuestion: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    paddingRight: SPACING.md,
  },
  faqAnswerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.divider,
  },
  faqAnswer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingTop: SPACING.sm,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    ...SHADOWS.small,
  },
  formLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  inputWrapper: {
    backgroundColor: COLORS.surfaceLight || '#1A1A24',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
    height: 50,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  multilineInputWrapper: {
    height: 120,
    paddingVertical: SPACING.sm,
  },
  input: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    width: '100%',
  },
  multilineInput: {
    height: '100%',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  successIconContainer: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  resetButton: {
    backgroundColor: COLORS.surfaceLight || '#1A1A24',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.sm,
    height: 46,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});

export default SupportScreen;
