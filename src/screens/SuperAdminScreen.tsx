import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, API_URL } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type SuperAdminScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'SuperAdmin'>;
};

export interface PendingOrg {
  id: string;
  name: string;
  category: string;
  license: string;
  mobile: string;
  city: string;
  address: string;
  status: string;
  doc_uri?: string;
  doc_type?: 'image' | 'pdf';
  doc_name?: string;
}

export interface ActiveAdmin {
  id: string;
  adminName: string;
  orgName: string;
  email: string;
  phone: string;
  status: string;
  joinedDate: string;
}

export default function SuperAdminScreen({ navigation }: SuperAdminScreenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'admins' | 'orgs' | 'requests'>('admins');

  const [admins, setAdmins] = useState<ActiveAdmin[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrg[]>([]);

  useEffect(() => {
    loadPendingOrganisations();
    loadActiveAdministrators();
  }, []);

  const loadPendingOrganisations = async () => {
    try {
      const response = await fetch(`${API_URL}/get_pending_organizations.php`);
      const resData = await response.json();

      if (resData.status === 'success' && Array.isArray(resData.organizations)) {
        setPendingOrgs(resData.organizations);
      } else {
        const stored = await AsyncStorage.getItem('pendingOrganisations');
        if (stored) setPendingOrgs(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Error loading pending organisations:', e);
      const stored = await AsyncStorage.getItem('pendingOrganisations');
      if (stored) setPendingOrgs(JSON.parse(stored));
    }
  };

  const loadActiveAdministrators = async () => {
    try {
      const response = await fetch(`${API_URL}/get_active_admins.php`);
      const resData = await response.json();

      if (resData.status === 'success' && Array.isArray(resData.admins)) {
        setAdmins(resData.admins);
      } else {
        const stored = await AsyncStorage.getItem('activeAdministrators');
        if (stored) setAdmins(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Error loading active administrators:', e);
      const stored = await AsyncStorage.getItem('activeAdministrators');
      if (stored) setAdmins(JSON.parse(stored));
    }
  };

  const handleApproveOrg = async (org: PendingOrg) => {
    try {
      try {
        await fetch(`${API_URL}/approve_organization.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: org.id, status: 'approved' }),
        });
      } catch (e) {
        console.log('Offline approval fallback');
      }

      await AsyncStorage.setItem(`orgStatus_${org.mobile}`, 'approved');
      const updatedList = pendingOrgs.filter((item) => item.id !== org.id);
      await AsyncStorage.setItem('pendingOrganisations', JSON.stringify(updatedList));
      setPendingOrgs(updatedList);

      const newAdmin: ActiveAdmin = {
        id: Date.now().toString(),
        adminName: 'Chief Medical Officer',
        orgName: org.name,
        email: `${org.name.toLowerCase().replace(/\s+/g, '')}@hospital.in`,
        phone: `+91 ${org.mobile}`,
        status: 'Active',
        joinedDate: 'Approved Just Now',
      };

      setAdmins((prev) => [newAdmin, ...prev]);
      Alert.alert('Approved!', `"${org.name}" has been successfully approved!`);
    } catch (e) {
      console.log('Approval exception:', e);
    }
  };

  const handleDeclineOrg = async (org: PendingOrg) => {
    try {
      try {
        await fetch(`${API_URL}/approve_organization.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: org.id, status: 'declined' }),
        });
      } catch (e) {
        console.log('Offline decline fallback');
      }

      await AsyncStorage.setItem(`orgStatus_${org.mobile}`, 'declined');
      const updatedList = pendingOrgs.filter((item) => item.id !== org.id);
      await AsyncStorage.setItem('pendingOrganisations', JSON.stringify(updatedList));
      setPendingOrgs(updatedList);
      Alert.alert('Declined', `"${org.name}" registration request has been declined.`);
    } catch (e) {
      console.log('Decline exception:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.topbarTitle}>Super Admin Dashboard</Text>
          <Text style={styles.topbarSub}>Verification & System Management</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(['admins', 'orgs'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {tab === 'admins' ? 'Active Admins' : `Pending Verification (${pendingOrgs.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'orgs' && (
          <View style={styles.section}>
            {pendingOrgs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No pending organization verification requests.</Text>
              </View>
            ) : (
              pendingOrgs.map((org) => (
                <View key={org.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{org.name}</Text>
                    <View style={[styles.badge, { backgroundColor: COLORS.AMBER_BG }]}>
                      <Text style={[styles.badgeText, { color: COLORS.AMBER_TEXT }]}>{org.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>License: {org.license}</Text>
                  <Text style={styles.cardSub}>Mobile: +91 {org.mobile}</Text>
                  <Text style={styles.cardSub}>Address: {org.address}, {org.city}</Text>

                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApproveOrg(org)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleDeclineOrg(org)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'admins' && (
          <View style={styles.section}>
            {admins.map((admin) => (
              <View key={admin.id} style={styles.card}>
                <Text style={styles.cardTitle}>{admin.orgName}</Text>
                <Text style={styles.cardSub}>{admin.adminName} • {admin.phone}</Text>
                <Text style={styles.cardSub}>{admin.email}</Text>
                <View style={[styles.badge, { backgroundColor: COLORS.GREEN_BG, alignSelf: 'flex-start', marginTop: 6 }]}>
                  <Text style={[styles.badgeText, { color: COLORS.GREEN_TEXT }]}>{admin.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
    backgroundColor: '#1E1E24',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  topbarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.BORDER,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  tabButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    gap: 10,
  },
  emptyContainer: {
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999999',
  },
  card: {
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  cardSub: {
    fontSize: 11,
    color: '#666666',
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
  },
});
