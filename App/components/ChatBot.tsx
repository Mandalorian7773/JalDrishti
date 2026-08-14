import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Droplet, MessageCircle, Send, X } from '@/components/Icons';
import { useTheme } from '@/constants/ThemeContext';
import { API } from '@/constants/api';
import tw from '@/constants/tailwind';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What is the national groundwater summary?',
  'Show critical stations in Goa',
  'Which states have the worst water levels?',
  'What does DWLR mean?',
];

export default function ChatBot() {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Animated scale for the FAB
  const scale = useRef(new Animated.Value(1)).current;

  const pulseIn = () =>
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  const pulseOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  // Animated opacity for the panel
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateY = useRef(new Animated.Value(20)).current;

  const openPanel = () => {
    setOpen(true);
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(panelTranslateY, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePanel = () => {
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(panelTranslateY, {
        toValue: 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setOpen(false));
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await fetch(`${API}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.error || 'Something went wrong.' },
        ]);
      }
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Could not reach the server. Is the backend running?' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── FAB (floating action button) ──────────────────────────────────────
  if (!open) {
    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            transform: [{ scale }],
          },
        ]}>
        <Pressable
          onPressIn={pulseIn}
          onPressOut={pulseOut}
          onPress={openPanel}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primaryBlue,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primaryBlue,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.45,
            shadowRadius: 14,
            elevation: 8,
          }}>
          <MessageCircle size={26} color="#fff" />
        </Pressable>
      </Animated.View>
    );
  }

  // ── Chat panel ────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 380,
          maxWidth: '92%',
          height: 520,
          maxHeight: '80%',
          zIndex: 9999,
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: colors.borderColor,
          shadowColor: isDark ? '#07111F' : '#0F172A',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.5 : 0.15,
          shadowRadius: 28,
          elevation: 12,
          opacity: panelOpacity,
          transform: [{ translateY: panelTranslateY }],
        },
      ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: colors.bgSubtle,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderColor,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: colors.primaryBlue,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <Droplet size={18} color="#fff" />
            </View>
            <View>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
                JalDrishti AI
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                Groundwater intelligence assistant
              </Text>
            </View>
          </View>
          <Pressable onPress={closePanel} hitSlop={12}>
            <X size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: colors.bgCanvas }}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }>
          {messages.length === 0 && (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.bgSubtle,
                  borderWidth: 1,
                  borderColor: colors.borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                <Droplet size={24} color={colors.brightBlue} />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontWeight: '600',
                  fontSize: 15,
                  marginBottom: 4,
                }}>
                Ask me anything!
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                  textAlign: 'center',
                  paddingHorizontal: 20,
                  marginBottom: 16,
                }}>
                I can query live CGWB groundwater data — stations, trends,
                categories, and more.
              </Text>
              <View style={{ width: '100%' }}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => sendMessage(s)}
                    style={{
                      backgroundColor: colors.cardBg,
                      borderWidth: 1,
                      borderColor: colors.borderColor,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 6,
                    }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((m, i) => (
            <View
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                marginBottom: 8,
              }}>
              {m.role === 'assistant' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: colors.primaryBlue,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 6,
                    }}>
                    <Droplet size={11} color="#fff" />
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                    JalDrishti AI
                  </Text>
                </View>
              )}
              <View
                style={{
                  backgroundColor: m.role === 'user' ? colors.primaryBlue : colors.cardBg,
                  borderRadius: 12,
                  borderTopRightRadius: m.role === 'user' ? 4 : 12,
                  borderTopLeftRadius: m.role === 'assistant' ? 4 : 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: m.role === 'assistant' ? 1 : 0,
                  borderColor: colors.borderColor,
                  shadowColor: isDark ? '#07111F' : '#0F172A',
                  shadowOpacity: isDark ? 0.2 : 0.08,
                  shadowOffset: { width: 0, height: 1 },
                  shadowRadius: 3,
                  elevation: 1,
                }}>
                <Text
                  style={{
                    color: m.role === 'user' ? '#fff' : colors.textPrimary,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                  selectable>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.cardBg,
                borderRadius: 12,
                borderTopLeftRadius: 4,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: colors.borderColor,
                marginBottom: 8,
              }}>
              <ActivityIndicator size="small" color={colors.brightBlue} />
              <Text style={{ color: colors.textMuted, fontSize: 13, marginLeft: 8 }}>
                Thinking…
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: colors.bgSubtle,
            borderTopWidth: 1,
            borderTopColor: colors.borderColor,
          }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            placeholder="Ask about groundwater…"
            placeholderTextColor={colors.textMuted}
            style={[
              {
                flex: 1,
                backgroundColor: colors.bgInput,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 13,
                color: colors.textPrimary,
                marginRight: 8,
                borderWidth: 1,
                borderColor: colors.borderColor,
              },
              Platform.OS === 'web'
                ? ({
                    outlineStyle: 'none',
                    outline: 'none',
                    border: 'none',
                  } as any)
                : {},
            ]}
            editable={!loading}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor:
                loading || !input.trim() ? colors.borderColor : colors.primaryBlue,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
