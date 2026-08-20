import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, API_URL } from '../constants/theme';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

type ChatListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Chat'>,
  StackNavigationProp<RootStackParamList>
>;

type ChatListScreenProps = {
  navigation: ChatListScreenNavigationProp;
};

export interface ChatItem {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatarBg: string;
  avatarColor: string;
  donor?: any;
}

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const [chatsList, setChatsList] = useState<ChatItem[]>([]);

  const fetchChats = async () => {
    try {
      const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';
      const response = await fetch(`${API_URL}/get_chats.php?org_mobile=${mobile}`);
      const resData = await response.json();

      if (resData.status === 'success' && Array.isArray(resData.chats)) {
        setChatsList(resData.chats);
      }
    } catch (e) {
      console.log('Error loading chats: ', e);
      setChatsList([
        {
          id: '1',
          name: 'Ravi Kumar',
          initials: 'RK',
          lastMessage: 'I am available for donation tomorrow at 10 AM.',
          time: '10:42 AM',
          unread: 1,
          avatarBg: COLORS.RED_BG,
          avatarColor: COLORS.RED_TEXT,
          donor: { id: '1', name: 'Ravi Kumar', initials: 'RK', bloodGroup: 'A+', distance: '2.3 km', status: 'Eligible' },
        },
      ]);
    }
  };

  useEffect(() => {
    fetchChats();
    const unsubscribe = navigation.addListener('focus', fetchChats);

    const interval = setInterval(fetchChats, 4000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>Messages</Text>
          <Text style={styles.topbarSub}>Donor conversations</Text>
        </View>
        <TouchableOpacity style={styles.topbarButton} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {chatsList.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatRow}
            onPress={() =>
              navigation.navigate('ChatDetail', {
                name: chat.name,
                status: 'Active',
              })
            }
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: chat.avatarBg }]}>
              <Text style={[styles.avatarText, { color: chat.avatarColor }]}>{chat.initials}</Text>
            </View>

            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{chat.name}</Text>
              <Text style={chat.unread > 0 ? styles.lastMessageUnread : styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
            </View>

            <View style={styles.rightContainer}>
              <Text style={chat.unread > 0 ? styles.timeTextUnread : styles.timeText}>{chat.time}</Text>
              {chat.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{chat.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  topbarButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 4,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  lastMessage: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  lastMessageUnread: {
    fontSize: 10,
    color: COLORS.TEXT_DARK,
    fontWeight: '600',
    marginTop: 2,
  },
  timeText: {
    fontSize: 9,
    color: '#BBBBBB',
  },
  timeTextUnread: {
    fontSize: 9,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
