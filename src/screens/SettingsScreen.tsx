import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, API_URL } from '../constants/theme';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;

type SettingsScreenProps = {
  navigation: SettingsScreenNavigationProp;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const [orgName, setOrgName] = useState('Apollo Hospital');
  const [orgLocation, setOrgLocation] = useState('Chennai • Hospital');
  const [orgCity, setOrgCity] = useState('Chennai');
  const [orgCategory, setOrgCategory] = useState('Hospital');
  const [orgLicense, setOrgLicense] = useState('TN-MED-2024-00872');
  const [orgPhotoUri, setOrgPhotoUri] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempCity, setTempCity] = useState('');

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';

        let nameVal = '';
        let categoryVal = '';
        let licenseVal = '';
        let cityVal = '';
        let locVal = '';

        try {
          const response = await fetch(`${API_URL}/get_profile.php?mobile=${mobile}`);
          const resData = await response.json();
          if (resData.status === 'success' && resData.organization) {
            const org = resData.organization;
            nameVal = org.name;
            categoryVal = org.category;
            licenseVal = org.license;
            cityVal = org.city;
            locVal = `${org.city} • ${org.category}`;
          }
        } catch (err) {
          console.log('Error pulling profile details from server: ', err);
        }

        if (!nameVal) {
          const storedName = await AsyncStorage.getItem(`orgName_${mobile}`);
          const storedLoc = await AsyncStorage.getItem(`orgLocation_${mobile}`);
          const storedLicense = await AsyncStorage.getItem(`orgLicense_${mobile}`);
          const storedCategory = await AsyncStorage.getItem(`orgCategory_${mobile}`);
          const storedCity = await AsyncStorage.getItem(`orgCity_${mobile}`);

          nameVal = storedName || (mobile === '9840012345' ? 'Apollo Hospital' : 'New Organisation');
          locVal = storedLoc || (mobile === '9840012345' ? 'Chennai • Hospital' : 'Local City • NGO');
          licenseVal = storedLicense || (mobile === '9840012345' ? 'TN-MED-2024-00872' : `LIC-${mobile}-2026`);
          categoryVal = storedCategory || (mobile === '9840012345' ? 'Hospital' : 'NGO');
          cityVal = storedCity || 'Chennai';
        }

        setOrgName(nameVal);
        setOrgLocation(locVal);
        setOrgLicense(licenseVal);
        setOrgCategory(categoryVal);
        setOrgCity(cityVal);

        const storedPhoto = await AsyncStorage.getItem(`orgPhotoUri_${mobile}`);
        setOrgPhotoUri(storedPhoto);
      } catch (e) {
        console.log('Error loading settings states: ', e);
      }
    };

    loadProfileData();
    const unsubscribe = navigation.addListener('focus', loadProfileData);
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'false');
    } catch (e) {
      console.log('Error clearing logout session: ', e);
    }
    (navigation as any).reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const handleOpenEdit = () => {
    setTempName(orgName);
    setTempCity(orgCity);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      return Alert.alert('Error', 'Organisation name cannot be empty.');
    }
    if (!tempCity.trim()) {
      return Alert.alert('Error', 'City details cannot be empty.');
    }

    try {
      const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';
      const newLoc = `${tempCity.trim()} • ${orgCategory}`;

      try {
        await fetch(`${API_URL}/save_profile.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile,
            name: tempName.trim(),
            city: tempCity.trim(),
          }),
        });
      } catch (e) {
        console.log('Offline save fallback');
      }

      setOrgName(tempName.trim());
      setOrgCity(tempCity.trim());
      setOrgLocation(newLoc);

      await AsyncStorage.setItem(`orgName_${mobile}`, tempName.trim());
      await AsyncStorage.setItem(`orgCity_${mobile}`, tempCity.trim());
      await AsyncStorage.setItem(`orgLocation_${mobile}`, newLoc);
      setShowEditModal(false);
    } catch (e) {
      console.log('Error saving profile changes: ', e);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };

  const handleChangeProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photo gallery to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';

        setOrgPhotoUri(selectedUri);
        await AsyncStorage.setItem(`orgPhotoUri_${mobile}`, selectedUri);
      }
    } catch (err) {
      console.log('Error picking profile picture: ', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Settings</Text>
        <Text style={styles.topbarSub}>Account & preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleChangeProfilePhoto} activeOpacity={0.8}>
            {orgPhotoUri ? (
              <Image source={{ uri: orgPhotoUri }} style={styles.avatarPhoto} />
            ) : (
              <View style={styles.avatarIcon}>
                <Ionicons name="business" size={24} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.orgNameText}>{orgName}</Text>
            <Text style={styles.orgLocText}>{orgLocation}</Text>
            <Text style={styles.orgLicenseText}>License: {orgLicense}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit} activeOpacity={0.7}>
            <Ionicons name="pencil" size={16} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.TEXT_DARK} />
            <Text style={styles.rowLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#DDDDDD', true: COLORS.PRIMARY }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="finger-print-outline" size={18} color={COLORS.TEXT_DARK} />
            <Text style={styles.rowLabel}>Biometric Login</Text>
          </View>
          <Switch
            value={biometric}
            onValueChange={setBiometric}
            trackColor={{ false: '#DDDDDD', true: COLORS.PRIMARY }}
          />
        </View>

        <Text style={styles.sectionHeader}>Admin Shortcut</Text>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => (navigation as any).navigate('SuperAdmin')}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.PRIMARY} />
            <Text style={[styles.rowLabel, { color: COLORS.PRIMARY, fontWeight: '600' }]}>
              Super Admin Portal
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DA0037" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showEditModal} transparent={true} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Organisation Name</Text>
            <TextInput
              style={styles.textInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Organisation Name"
            />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.textInput}
              value={tempCity}
              onChangeText={setTempCity}
              placeholder="City"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  avatarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orgNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  orgLocText: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  orgLicenseText: {
    fontSize: 9,
    color: '#999999',
    marginTop: 2,
  },
  editBtn: {
    padding: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.BORDER,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.BORDER,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFEAEA',
  },
  logoutBtnText: {
    color: '#DA0037',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#555555',
    fontWeight: '600',
  },
});
