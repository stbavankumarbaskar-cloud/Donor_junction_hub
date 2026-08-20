import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, API_URL } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type ChatDetailScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ChatDetail'>;
  route: RouteProp<RootStackParamList, 'ChatDetail'>;
};

interface MessageItem {
  id: string | number;
  text: string;
  me: boolean;
}

export default function ChatDetailScreen({ route, navigation }: ChatDetailScreenProps) {
  const { name = 'Ravi Kumar', bloodType = 'A+', status = 'Eligible' } = route.params || {};

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const [messages, setMessages] = useState<MessageItem[]>([
    { id: '1', text: 'Hello! I saw your urgent blood campaign request.', me: false },
    { id: '2', text: 'Thank you for reaching out! Are you available to donate tomorrow morning?', me: true },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const fetchMessages = async () => {
    try {
      const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';
      const response = await fetch(`${API_URL}/get_messages.php?donor_id=1&org_mobile=${mobile}`);
      const resData = await response.json();

      if (resData.status === 'success' && Array.isArray(resData.messages)) {
        setMessages(resData.messages);
      }
    } catch (e) {
      console.log('Error loading messages: ', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const msgText = inputText.trim();
    setInputText('');
    inputRef.current?.focus();

    const newMsg: MessageItem = {
      id: Date.now().toString(),
      text: msgText,
      me: true,
    };

    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';
      await fetch(`${API_URL}/send_message.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_id: '1',
          org_mobile: mobile,
          message_text: msgText,
          is_me: 1,
        }),
      });
    } catch (e) {
      console.log('Offline message sent fallback');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.topbarTitle}>{name}</Text>
            <Text style={styles.topbarSub}>
              {bloodType} • 2.3 km • {status}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.topbarButton} activeOpacity={0.7}>
          <Ionicons name="call" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrapper, item.me ? styles.meWrapper : styles.themWrapper]}>
              <View style={[styles.bubble, item.me ? styles.meBubble : styles.themBubble]}>
                <Text style={[styles.bubbleText, item.me ? styles.meText : styles.themText]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#BBBBBB"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.8}>
            <Ionicons name="send" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topbar: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    paddingRight: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  topbarButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  meWrapper: {
    justifyContent: 'flex-end',
  },
  themWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  meBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 2,
  },
  themBubble: {
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  meText: {
    color: '#FFFFFF',
  },
  themText: {
    color: COLORS.TEXT_DARK,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.BORDER,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
