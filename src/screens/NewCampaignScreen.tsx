import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, API_URL } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type NewCampaignScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'NewCampaign'>;
};

export default function NewCampaignScreen({ navigation }: NewCampaignScreenProps) {
  const [title, setTitle] = useState('');
  const [bloodGroup, setBloodGroup] = useState('All groups');
  const [units, setUnits] = useState('');
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [showBloodModal, setShowBloodModal] = useState(false);
  const bloodGroupsList = ['All groups', 'A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

  const handlePickBannerImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need access to your photo gallery to upload a dynamic campaign banner image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error picking campaign banner: ', err);
      Alert.alert('Error', 'Unable to access your photo gallery at this moment.');
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      return Alert.alert('Missing Field', 'Please enter a campaign title.');
    }
    if (!place.trim()) {
      return Alert.alert('Missing Field', 'Please enter a campaign location/place.');
    }
    if (!units.trim()) {
      return Alert.alert('Missing Field', 'Please specify the target collection units.');
    }
    if (!date.trim()) {
      return Alert.alert('Missing Field', 'Please enter a campaign date.');
    }
    if (!startTime.trim() || !endTime.trim()) {
      return Alert.alert('Missing Field', 'Please specify both start and end times.');
    }

    const targetUnits = parseInt(units.replace(/[^0-9]/g, '')) || 10;

    try {
      const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';
      const isUrgent = targetUnits >= 30;
      const statusText = isUrgent ? 'Urgent' : 'Active';
      const statusColor = isUrgent ? COLORS.RED_TEXT : COLORS.GREEN_TEXT;
      const statusBg = isUrgent ? COLORS.RED_BG : COLORS.GREEN_BG;

      const bodyData = {
        id: Date.now().toString(),
        org_mobile: mobile,
        title: title.trim(),
        date_time: `${date} • ${startTime.trim()} - ${endTime.trim()}`,
        place: place.trim(),
        status: statusText,
        status_color: statusColor,
        status_bg: statusBg,
        description: `${bloodGroup} needed • Target collection: ${targetUnits} Units`,
        collected: 0,
        target: targetUnits,
        image_uri: imageUri,
      };

      try {
        await fetch(`${API_URL}/create_campaign.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
      } catch (apiErr) {
        console.log('Offline campaign creation fallback');
      }

      const stored = await AsyncStorage.getItem('campaignsList');
      let currentList = stored ? JSON.parse(stored) : [];

      const newCampaign = {
        id: bodyData.id,
        title: bodyData.title,
        date: bodyData.date_time,
        place: bodyData.place,
        status: bodyData.status,
        statusColor: bodyData.status_color,
        statusBg: bodyData.status_bg,
        description: bodyData.description,
        collected: bodyData.collected,
        target: bodyData.target,
        imageUri: bodyData.image_uri,
      };

      currentList.unshift(newCampaign);
      await AsyncStorage.setItem('campaignsList', JSON.stringify(currentList));

      navigation.replace('CampaignDone', { campaignId: bodyData.id, title: bodyData.title });
    } catch (e) {
      console.log('Error creating campaign: ', e);
      Alert.alert('Publish Error', 'Unable to register your blood drive campaign.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Create campaign</Text>
        <Text style={styles.topbarSub}>Post a blood requirement</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        <Text style={styles.label}>Campaign title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. World Blood Day Apollo Drive"
          placeholderTextColor="#BBBBBB"
        />

        <Text style={styles.label}>Place of campaign</Text>
        <TextInput
          style={styles.input}
          value={place}
          onChangeText={setPlace}
          placeholder="e.g. Apollo Hospital Main Auditorium"
          placeholderTextColor="#BBBBBB"
        />

        <Text style={styles.label}>Blood group needed</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowBloodModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownText}>{bloodGroup}</Text>
          <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
        </TouchableOpacity>

        <Text style={styles.label}>Units required (Target)</Text>
        <TextInput
          style={styles.input}
          value={units}
          onChangeText={setUnits}
          keyboardType="numeric"
          placeholder="e.g. 20"
          placeholderTextColor="#BBBBBB"
        />

        <Text style={styles.label}>Date of campaign</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputWithIcon}
            value={date}
            onChangeText={setDate}
            placeholder="e.g. June 25, 2025"
            placeholderTextColor="#BBBBBB"
          />
          <Ionicons name="calendar-outline" size={16} color="#AAAAAA" style={styles.inputIcon} />
        </View>

        <View style={styles.timesRow}>
          <View style={styles.timeCol}>
            <Text style={styles.label}>Start time</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="e.g. 09:00 AM"
              placeholderTextColor="#BBBBBB"
            />
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.label}>End time</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="e.g. 05:00 PM"
              placeholderTextColor="#BBBBBB"
            />
          </View>
        </View>

        <Text style={styles.label}>Add image banner</Text>
        {imageUri ? (
          <View style={styles.bannerWrapper}>
            <Image source={{ uri: imageUri }} style={styles.bannerPreview} />
            <TouchableOpacity
              style={styles.changeBannerButton}
              onPress={handlePickBannerImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.changeBannerText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handlePickBannerImage}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={26} color={COLORS.PRIMARY} />
            <Text style={styles.uploadTitle}>Pick Campaign Banner</Text>
            <Text style={styles.uploadSubtitle}>16:9 ratio recommended • Max 5MB</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePublish}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Publish Campaign</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showBloodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBloodModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBloodModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Blood Group</Text>
              <TouchableOpacity onPress={() => setShowBloodModal(false)}>
                <Ionicons name="close" size={20} color="#888888" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={bloodGroupsList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setBloodGroup(item);
                    setShowBloodModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {bloodGroup === item && (
                    <Ionicons name="checkmark" size={16} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: 18,
    paddingHorizontal: 20,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    backgroundColor: '#FAFAFA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },
  inputIcon: {
    marginLeft: 6,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },
  timesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCol: {
    flex: 1,
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginTop: 6,
  },
  uploadSubtitle: {
    fontSize: 9,
    color: '#BBBBBB',
    marginTop: 2,
  },
  bannerWrapper: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bannerPreview: {
    width: '100%',
    height: 140,
  },
  changeBannerButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 24,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
  },
  secondaryButtonText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
});
