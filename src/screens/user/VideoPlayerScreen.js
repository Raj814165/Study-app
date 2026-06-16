import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

// ─── YouTube helpers ───────────────────────────────────────────────────
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// ─── Time formatter ────────────────────────────────────────────────────
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// ─── Custom Controls Overlay ───────────────────────────────────────────
const CustomControls = ({
  isPlaying,
  currentTime,
  duration,
  isBuffering,
  onPlayPause,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onToggleFullscreen,
  visible,
  onToggleVisibility,
}) => {
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimeout = useRef(null);

  useEffect(() => {
    Animated.timing(controlsOpacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // Auto-hide after 4 seconds when playing
  useEffect(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (visible && isPlaying) {
      hideTimeout.current = setTimeout(() => {
        onToggleVisibility(false);
      }, 4000);
    }
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [visible, isPlaying]);

  const progress = duration > 0 ? currentTime / duration : 0;

  const handleSeekPress = (evt) => {
    if (Platform.OS === 'web') {
      const rect = evt.target.getBoundingClientRect();
      const x = evt.nativeEvent.pageX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      onSeek(ratio * duration);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.controlsWrapper}
      onPress={() => onToggleVisibility(!visible)}
    >
      {isBuffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.75)']}
          style={styles.controlsGradient}
        >
          {/* Center Controls */}
          <View style={styles.centerControls}>
            <TouchableOpacity onPress={onSkipBackward} style={styles.skipButton}>
              <Ionicons name="play-back" size={28} color={COLORS.white} />
              <Text style={styles.skipText}>10s</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onPlayPause} style={styles.playPauseButton}>
              <View style={styles.playPauseCircle}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color={COLORS.white}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSkipForward} style={styles.skipButton}>
              <Ionicons name="play-forward" size={28} color={COLORS.white} />
              <Text style={styles.skipText}>10s</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

            <TouchableOpacity
              style={styles.seekBarContainer}
              onPress={handleSeekPress}
              activeOpacity={1}
            >
              <View style={styles.seekBarTrack}>
                <LinearGradient
                  colors={COLORS.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.seekBarProgress, { width: `${progress * 100}%` }]}
                >
                  <View style={styles.seekBarThumb} />
                </LinearGradient>
              </View>
            </TouchableOpacity>

            <Text style={styles.timeText}>{formatTime(duration)}</Text>

            {onToggleFullscreen && (
              <TouchableOpacity onPress={onToggleFullscreen} style={styles.fullscreenButton}>
                <Ionicons name="expand-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── YouTube Player (Native) ───────────────────────────────────────────
const NativeYouTubePlayer = ({ videoId }) => {
  const YoutubeIframe = require('react-native-youtube-iframe').default;

  return (
    <View style={styles.videoContainer}>
      <YoutubeIframe
        height={VIDEO_HEIGHT}
        width={'100%'}
        videoId={videoId}
        initialPlayerParams={{
          controls: true,
          modestbranding: true,
          rel: false,
        }}
      />
    </View>
  );
};

// ─── YouTube Player (Web & Native) ────────────────────────────────────
const YouTubePlayer = ({ videoId }) => {
  if (Platform.OS !== 'web') {
    return <NativeYouTubePlayer videoId={videoId} />;
  }

  return (
    <View style={styles.videoContainer}>
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </View>
  );
};

// ─── Direct Video Player (HTML5 on web, expo-av on native) ─────────────
const DirectVideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || !videoRef.current) return;

    const video = videoRef.current;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onLoadedData = () => setIsBuffering(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadeddata', onLoadedData);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadeddata', onLoadedData);
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setControlsVisible(true);
  }, [isPlaying]);

  const handleSeek = useCallback((time) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    setControlsVisible(true);
  }, []);

  const handleSkipForward = useCallback(() => {
    if (!videoRef.current) return;
    const newTime = Math.min(currentTime + 10, duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setControlsVisible(true);
  }, [currentTime, duration]);

  const handleSkipBackward = useCallback(() => {
    if (!videoRef.current) return;
    const newTime = Math.max(currentTime - 10, 0);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setControlsVisible(true);
  }, [currentTime]);

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
    else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen();
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.videoContainer}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          playsInline
        />
        <CustomControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isBuffering={isBuffering}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onSkipForward={handleSkipForward}
          onSkipBackward={handleSkipBackward}
          onToggleFullscreen={handleFullscreen}
          visible={controlsVisible}
          onToggleVisibility={setControlsVisible}
        />
      </View>
    );
  }

  // Native — use WebView as a fallback for expo-av
  const NativeVideoPlayer = () => {
    const { WebView } = require('react-native-webview');
    
    // Fix localhost issue for real devices (localhost points to the phone, not the PC)
    let processedUrl = videoUrl;
    if (processedUrl && processedUrl.includes('localhost')) {
      processedUrl = processedUrl.replace('localhost', '10.109.22.65');
    }

    return (
      <View style={styles.videoContainer}>
        <WebView
          source={{
            html: `
              <html>
                <body style="margin:0;padding:0;background-color:#000;display:flex;justify-content:center;align-items:center;">
                  <video 
                    src="${processedUrl}" 
                    style="width:100%;height:100%;object-fit:contain;" 
                    controls 
                    controlsList="nodownload"
                    playsinline
                  ></video>
                </body>
              </html>
            `,
          }}
          style={{ flex: 1, backgroundColor: '#000' }}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
        />
      </View>
    );
  };

  return <NativeVideoPlayer />;
};

// ─── Live Chat Panel ───────────────────────────────────────────────────
const formatChatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${ampm}`;
};

const CommentsPanel = ({ isVisible }) => {
  const { user } = useAuth();
  const chatContext = require('../../context/ChatContext').useChat();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Secret Support Chat Mode State
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messageViewTimes, setMessageViewTimes] = useState({});
  const [selectedComments, setSelectedComments] = useState([]);
  const [, forceUpdate] = useState(0);

  // Local demo comments state
  const [demoMessages, setDemoMessages] = useState([
    { id: 'd1', senderId: 'admin', senderName: 'Instructor Sarah', text: 'Welcome students! Aapke saare doubts yahan pooch sakte ho.', timestamp: Date.now() - 3600000 },
    { id: 'd2', senderId: 'u2', senderName: 'Priya', text: 'Wow, kya mast samjhaya hai aapne, clear ho gaya sab kuch!', timestamp: Date.now() - 3500000 },
    { id: 'd3', senderId: 'u3', senderName: 'Amit', text: 'Notes kahan milenge is lecture ke?', timestamp: Date.now() - 3400000 },
    { id: 'd4', senderId: 'u4', senderName: 'Sneha', text: 'Ye exam me aayega kya? Important lag raha hai.', timestamp: Date.now() - 3300000 },
    { id: 'd5', senderId: 'u5', senderName: 'Rohan', text: 'Bohot badhiya lecture tha sir, thanks a lot!', timestamp: Date.now() - 3200000 },
    { id: 'd6', senderId: 'u6', senderName: 'Rahul', text: 'Bhai ye 2nd part samajh nahi aaya, koi samjhayega kya?', timestamp: Date.now() - 3100000 },
    { id: 'd7', senderId: 'u7', senderName: 'Vikas', text: 'Audio thoda low hai starting me, par manage ho jayega.', timestamp: Date.now() - 3000000 },
    { id: 'd8', senderId: 'u8', senderName: 'Kajal', text: 'Mujhe ye formula yaad karne ka koi shortcut batao.', timestamp: Date.now() - 2900000 },
    { id: 'd9', senderId: 'u9', senderName: 'Manish', text: 'Next video kab aayega sir?', timestamp: Date.now() - 2800000 },
    { id: 'd10', senderId: 'u10', senderName: 'Neha', text: 'Mera doubt clear ho gaya, finally samajh aa gaya ye topic.', timestamp: Date.now() - 2700000 },
    { id: 'd11', senderId: 'u11', senderName: 'Sandeep', text: 'Sir aapne bohot simple way me explain kiya hai.', timestamp: Date.now() - 2600000 },
    { id: 'd12', senderId: 'u12', senderName: 'Pooja', text: 'PDF notes kab upload honge?', timestamp: Date.now() - 2500000 },
    { id: 'd13', senderId: 'u13', senderName: 'Karan', text: 'Kal ka live session kitne baje hai?', timestamp: Date.now() - 2400000 },
    { id: 'd14', senderId: 'admin', senderName: 'Instructor Sarah', text: 'Next live session kal shaam 6 baje hoga.', timestamp: Date.now() - 2300000 },
    { id: 'd15', senderId: 'u15', senderName: 'Anjali', text: 'Bhai kisiko question 4 ka answer pata hai kya?', timestamp: Date.now() - 2200000 },
    { id: 'd16', senderId: 'u16', senderName: 'Deepak', text: 'Pura syllabus cover hoga na is course me?', timestamp: Date.now() - 2100000 },
    { id: 'd17', senderId: 'u17', senderName: 'Shruti', text: 'Maine kal hi join kiya, ye samajhne me easy hai kya?', timestamp: Date.now() - 2000000 },
    { id: 'd18', senderId: 'u18', senderName: 'Arjun', text: 'Haan Shruti, basics se cover kiya hai sir ne.', timestamp: Date.now() - 1900000 },
    { id: 'd19', senderId: 'u19', senderName: 'Nisha', text: 'Thank you sir, revision ke liye perfect video hai.', timestamp: Date.now() - 1800000 },
    { id: 'd20', senderId: 'u20', senderName: 'Tarun', text: 'Mujhe abhi bhi doubt hai 5:30 wale timestamp pe.', timestamp: Date.now() - 1700000 },
    { id: 'd21', senderId: 'u21', senderName: 'Ravi', text: 'Tarun bhai, wahan sir ne cross multiply kiya hai bas.', timestamp: Date.now() - 1600000 },
    { id: 'd22', senderId: 'u22', senderName: 'Simran', text: 'Ohoo, ab samajh aaya! Trick bohot sahi thi.', timestamp: Date.now() - 1500000 },
    { id: 'd23', senderId: 'u23', senderName: 'Aditya', text: 'Ye topic kitne marks ka aata hai boards me?', timestamp: Date.now() - 1400000 },
    { id: 'd24', senderId: 'u24', senderName: 'Megha', text: 'Mostly 4-5 marks ka weightage hota hai iska.', timestamp: Date.now() - 1300000 },
    { id: 'd25', senderId: 'admin', senderName: 'Instructor Sarah', text: 'Bilkul sahi, exam perspective se bohot important hai ye.', timestamp: Date.now() - 1200000 },
    { id: 'd26', senderId: 'u26', senderName: 'Gaurav', text: 'Sir ek dedicated video numericals pe bhi bana do.', timestamp: Date.now() - 1100000 },
    { id: 'd27', senderId: 'u27', senderName: 'Kritika', text: 'Yes, numericals me bohot problem hoti hai mujhe bhi.', timestamp: Date.now() - 1000000 },
    { id: 'd28', senderId: 'u28', senderName: 'Vivek', text: 'Video ki speed 1.5x karke dekhne me maza aa raha hai!', timestamp: Date.now() - 900000 },
    { id: 'd29', senderId: 'u29', senderName: 'Sonal', text: 'Ekdum crystal clear ho gaya, maza aa gaya.', timestamp: Date.now() - 800000 },
    { id: 'd30', senderId: 'u30', senderName: 'Raj', text: 'Bhai tu akela nahi hai, maine bhi 1.5x pe hi dekhi hai 😂', timestamp: Date.now() - 700000 }
  ]);

  // Support Chat Logic
  const conversation = isSupportMode ? chatContext.getUserConversation(user?.uid) : null;
  const supportMessages = conversation?.messages || [];
  
  useEffect(() => {
    if (!isSupportMode) return;
    
    let updated = false;
    const newTimes = { ...messageViewTimes };
    
    supportMessages.forEach(msg => {
      if (!newTimes[msg.id]) {
        newTimes[msg.id] = Date.now();
        updated = true;
      }
    });
    
    if (updated) {
      setMessageViewTimes(newTimes);
    }
  }, [isSupportMode, supportMessages, messageViewTimes]);

  const visibleSupportMessages = supportMessages.filter((msg) => {
    // Both admin and user messages disappear 10 seconds after they are first viewed
    const viewTime = messageViewTimes[msg.id];
    if (!viewTime) return true; // Show until viewed
    return Date.now() - viewTime < 10000;
  });

  // Auto-revert to comments after 20 seconds of inactivity in support mode
  useEffect(() => {
    if (!isSupportMode) return;
    const timeout = setTimeout(() => {
      setIsSupportMode(false);
    }, 20000);
    return () => clearTimeout(timeout);
  }, [isSupportMode, supportMessages.length]);

  // Re-render periodically to hide newly expired messages in support mode
  useEffect(() => {
    if (!isSupportMode) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 500);
    return () => clearInterval(interval);
  }, [isSupportMode]);

  useEffect(() => {
    if (isSupportMode && user) {
      const conv = chatContext.getOrCreateConversation(user);
      setConversationId(conv.id);
      chatContext.markReadByUser(conv.id);
    }
  }, [isSupportMode, user]);

  useEffect(() => {
    if (isSupportMode && conversationId) {
      chatContext.markReadByUser(conversationId);
    }
  }, [visibleSupportMessages.length, isSupportMode, conversationId]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 1 : 0,
      tension: 65,
      friction: 11,
      useNativeDriver: false,
    }).start();

    if (!isVisible) {
      setIsSupportMode(false);
      setSelectedComments([]);
    }
  }, [isVisible]);

  const activeMessages = isSupportMode ? visibleSupportMessages : demoMessages;

  useEffect(() => {
    if (activeMessages.length > 0 && isVisible) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [activeMessages.length, isVisible]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Check for secret code to unlock live support chat
    if (inputText.trim() === '#SUPPORT' && !isSupportMode) {
      setIsSupportMode(true);
      setInputText('');
      return;
    }

    if (isSupportMode) {
      if (!conversationId) return;
      chatContext.sendMessage(conversationId, inputText, {
        uid: user.uid,
        displayName: user.displayName,
        role: 'user',
      });
    } else {
      const newMsg = {
        id: Date.now().toString(),
        senderId: user?.uid || 'local_user',
        senderName: user?.displayName || 'You',
        text: inputText,
        timestamp: Date.now(),
      };
      setDemoMessages((prev) => [...prev, newMsg]);
    }
    setInputText('');
  };

  const chatHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });

  const handleDeleteSelected = () => {
    if (!isSupportMode) {
      setDemoMessages((prev) => prev.filter((m) => !selectedComments.includes(m.id)));
      setSelectedComments([]);
    }
  };

  const toggleSelection = (id) => {
    setSelectedComments((prev) => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const renderChatMessage = ({ item }) => {
    const isOwn = item.senderId === user?.uid || item.senderId === 'local_user';
    const isSelected = selectedComments.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!isSupportMode && isOwn) {
            toggleSelection(item.id);
          }
        }}
        onLongPress={() => {
          if (!isSupportMode && isOwn && selectedComments.length === 0) {
            toggleSelection(item.id);
          }
        }}
        style={[
          chatStyles.messageRow,
          isOwn && chatStyles.messageRowOwn,
          isSelected && { backgroundColor: COLORS.error + '15', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginHorizontal: -8 }
        ]}
      >
        {!isOwn && (
          <LinearGradient colors={COLORS.gradientAccent} style={chatStyles.chatAvatar}>
            <Text style={chatStyles.chatAvatarText}>
              {(item.senderName || 'A').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        <View style={[chatStyles.chatBubble, isOwn ? chatStyles.chatBubbleOwn : chatStyles.chatBubbleOther]}>
          {!isOwn && (
            <Text style={chatStyles.chatSenderName}>{item.senderName || 'Support'}</Text>
          )}
          <Text style={[chatStyles.chatMessageText, isOwn && chatStyles.chatMessageTextOwn]}>
            {item.text}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginTop: 4 }}>
            <Text style={[chatStyles.chatTimestamp, isOwn && chatStyles.chatTimestampOwn, { marginTop: 0 }]}>
              {formatChatTime(item.timestamp)}
            </Text>
          </View>
        </View>
        {isOwn && (
          <View style={chatStyles.chatAvatarOwn}>
            <Text style={chatStyles.chatAvatarOwnText}>
              {(user?.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[chatStyles.chatPanel, { height: chatHeight }]}>
      {isVisible && (
        <>
          {/* Chat Header */}
          <View style={chatStyles.chatHeader}>
            <View style={chatStyles.chatHeaderLeft}>
              <View style={chatStyles.liveDot} />
              <Text style={chatStyles.chatHeaderTitle}>{isSupportMode ? 'Live Support Chat' : 'Comments'}</Text>
            </View>
            {selectedComments.length > 0 ? (
              <TouchableOpacity onPress={handleDeleteSelected} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: COLORS.error, fontSize: 13, fontWeight: 'bold', marginRight: 4 }}>
                  Delete ({selectedComments.length})
                </Text>
                <Ionicons name="trash" size={18} color={COLORS.error} />
              </TouchableOpacity>
            ) : (
              <Text style={chatStyles.chatHeaderCount}>
                {activeMessages.length} {isSupportMode ? 'message' : 'comment'}{activeMessages.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            renderItem={renderChatMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={chatStyles.chatMessagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={chatStyles.chatEmpty}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.textMuted} />
                <Text style={chatStyles.chatEmptyText}>No messages yet. Say hi!</Text>
              </View>
            }
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {/* Input Bar */}
          <View style={chatStyles.chatInputBar}>
            <TextInput
              style={chatStyles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textPlaceholder}
              onSubmitEditing={handleSend}
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.8}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? COLORS.gradientPrimary : [COLORS.surfaceLight, COLORS.surfaceLight]}
                style={chatStyles.chatSendBtn}
              >
                <Ionicons name="send" size={16} color={inputText.trim() ? COLORS.white : COLORS.textMuted} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────
const VideoPlayerScreen = ({ route, navigation }) => {
  const { videoUrl, lessonTitle } = route.params || {};
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [commentsOpen, setCommentsOpen] = useState(false);

  const hasValidUrl = videoUrl && videoUrl.trim().length > 0;
  const youtubeId = getYouTubeVideoId(videoUrl);
  const isYouTube = !!youtubeId;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // ── No URL fallback ──
  if (!hasValidUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lessonTitle || 'Video Player'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.placeholder}>
          <View style={styles.placeholderIconContainer}>
            <LinearGradient colors={COLORS.gradientDark} style={styles.placeholderIconBg}>
              <Ionicons name="videocam-off-outline" size={64} color={COLORS.textMuted} />
            </LinearGradient>
          </View>
          <Text style={styles.placeholderTitle}>Video Not Available</Text>
          <Text style={styles.placeholderText}>
            The video URL for this lesson is not available yet. Please check back later or contact support.
          </Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goBackButtonInner}>
              <Ionicons name="arrow-back" size={18} color={COLORS.white} />
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main player view ──
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lessonTitle || 'Video Player'}
        </Text>
        {/* Top Chat Icon Removed */}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.ScrollView
          style={[styles.videoSection, { opacity: fadeAnim }]}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Video — YouTube or Direct */}
          {isYouTube ? (
            <YouTubePlayer videoId={youtubeId} />
          ) : (
            <DirectVideoPlayer videoUrl={videoUrl} />
          )}

          {/* Lesson Info + Chat Toggle */}
          <View style={styles.lessonInfoContainer}>
            <View style={styles.lessonInfoCard}>
              <View style={styles.lessonTitleRow}>
                <View style={[styles.lessonPlayIcon, isYouTube && { backgroundColor: '#FF000020' }]}>
                  {isYouTube ? (
                    <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                  ) : (
                    <Ionicons name="musical-notes" size={18} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.lessonTextContainer}>
                  <Text style={styles.nowPlaying}>Now Playing</Text>
                  <Text style={styles.lessonName} numberOfLines={2}>
                    {lessonTitle || 'Untitled Lesson'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCommentsOpen(!commentsOpen)}
                  style={styles.chatToggleChip}
                  activeOpacity={0.7}
                >
                  <View style={commentsOpen ? styles.liveDotSmallActive : styles.liveDotSmall} />
                  <Text style={[styles.chatToggleChipText, commentsOpen && { color: COLORS.primary }]}>
                    {commentsOpen ? 'Comments On' : 'Comments'}
                  </Text>
                </TouchableOpacity>
              </View>
              {isYouTube && (
                <View style={styles.youtubeTag}>
                  <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                  <Text style={styles.youtubeTagText}>Streamed via YouTube</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: SPACING.xl }} />
        </Animated.ScrollView>

        {/* Comments Panel */}
        <CommentsPanel isVisible={commentsOpen} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  // Video
  videoSection: {
    flex: 1,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  // Controls wrapper (full area, catches taps)
  controlsWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  // Buffering
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 5,
  },
  // Controls
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xxxl + SPACING.xl,
  },
  skipButton: {
    alignItems: 'center',
  },
  skipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHTS.medium,
  },
  playPauseButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(108, 92, 231, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  // Bottom Controls
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    minWidth: 38,
    textAlign: 'center',
  },
  seekBarContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    cursor: 'pointer',
  },
  seekBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'visible',
  },
  seekBarProgress: {
    height: '100%',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  seekBarThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    position: 'absolute',
    right: -7,
    ...SHADOWS.small,
  },
  fullscreenButton: {
    padding: SPACING.xs,
  },
  // Native YouTube fallback
  nativeFallback: {
    width: '100%',
    height: '100%',
  },
  nativeFallbackBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  nativeFallbackTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  nativeFallbackText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  // Placeholder
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  placeholderIconContainer: {
    marginBottom: SPACING.xxl,
  },
  placeholderIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  goBackButton: {
    ...SHADOWS.medium,
  },
  goBackButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    gap: SPACING.sm,
  },
  goBackButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
  },
  // Lesson Info
  lessonInfoContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  lessonInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.medium,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonPlayIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  lessonTextContainer: {
    flex: 1,
  },
  nowPlaying: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  lessonName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  youtubeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  youtubeTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  // Chat toggle
  chatToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatToggleBtnActive: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  chatToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chatToggleChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  liveDotSmallActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
});

// ─── Chat Panel Styles ─────────────────────────────────────────────────
const chatStyles = StyleSheet.create({
  chatPanel: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: Platform.OS === 'ios' ? SPACING.xxl : SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  chatHeaderTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  chatHeaderCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chatMessagesList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xs,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  chatAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  chatAvatarText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  chatAvatarOwn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  chatAvatarOwnText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  chatBubble: {
    maxWidth: '75%',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chatBubbleOwn: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    backgroundColor: COLORS.surfaceLight,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chatSenderName: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  chatMessageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 18,
  },
  chatMessageTextOwn: {
    color: COLORS.white,
  },
  chatTimestamp: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chatTimestampOwn: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  chatEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  chatEmptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    maxHeight: 60,
  },
  chatSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VideoPlayerScreen;
