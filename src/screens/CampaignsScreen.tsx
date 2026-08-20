import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, API_URL } from '../constants/theme';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

type CampaignsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Campaigns'>,
  StackNavigationProp<RootStackParamList>
>;

type CampaignsScreenProps = {
  navigation: CampaignsScreenNavigationProp;
};

export interface CampaignItem {
  id: string;
  title: string;
  date: string;
  place: string;
  status: string;
  statusColor: string;
  statusBg: string;
  description: string;
  collected: number;
  target: number;
  imageUri?: string | null;
}

export default function CampaignsScreen({ navigation }: CampaignsScreenProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Closed'>('All');
  const [campaignsList, setCampaignsList] = useState<CampaignItem[]>([]);

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [unitsToAdd, setUnitsToAdd] = useState(1);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<CampaignItem | null>(null);

  const loadCampaigns = async () => {
    try {
      const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';
      try {
        const response = await fetch(`${API_URL}/get_campaigns.php?org_mobile=${mobile}`);
        const resData = await response.json();

        if (resData.status === 'success' && resData.campaigns) {
          setCampaignsList(resData.campaigns);
          await AsyncStorage.setItem('campaignsList', JSON.stringify(resData.campaigns));
          return;
        }
      } catch (apiErr) {
        // Fall back to storage if network fails
      }

      const stored = await AsyncStorage.getItem('campaignsList');
      if (stored) {
        setCampaignsList(JSON.parse(stored));
      } else {
        const initialList: CampaignItem[] = [
          {
            id: '1',
            title: 'World Blood Day 2025',
            date: 'June 14 • 09:00 AM - 05:00 PM',
            place: 'Apollo Hospital Main Auditorium',
            status: 'Active',
            statusColor: COLORS.GREEN_TEXT,
            statusBg: COLORS.GREEN_BG,
            description: 'All blood groups • 50 donors registered',
            collected: 32,
            target: 50,
            imageUri: null,
          },
          {
            id: '2',
            title: 'A+ emergency drive',
            date: 'June 10–16 • 24 Hours Open',
            place: 'Chennai Central Blood Bank',
            status: 'Urgent',
            statusColor: COLORS.RED_TEXT,
            statusBg: COLORS.RED_BG,
            description: 'A+ only • 2 donors confirmed',
            collected: 3,
            target: 10,
            imageUri: null,
          },
          {
            id: '3',
            title: 'Monthly thalassemia donors',
            date: 'Recurring • 10:00 AM - 02:00 PM',
            place: 'Red Cross Society Clinic',
            status: 'Open',
            statusColor: COLORS.BLUE_TEXT,
            statusBg: COLORS.BLUE_BG,
            description: 'O- only • 5 regular donors',
            collected: 0,
            target: 5,
            imageUri: null,
          },
        ];
        await AsyncStorage.setItem('campaignsList', JSON.stringify(initialList));
        setCampaignsList(initialList);
      }
    } catch (e) {
      console.log('Error loading campaigns list: ', e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCampaigns();
    });
    return unsubscribe;
  }, [navigation]);

  const handleOpenDetailModal = (camp: CampaignItem) => {
    setDetailCampaign(camp);
    setShowDetailModal(true);
  };

  const handleOpenLogModal = (camp: CampaignItem) => {
    setSelectedCampaign(camp);
    setUnitsToAdd(1);
    setShowLogModal(true);
  };

  const updateProgress = async (id: string, increment: number) => {
    try {
      const targetCampaign = campaignsList.find((c) => c.id === id);
      if (!targetCampaign) return;

      const newCollected = targetCampaign.collected + increment;
      const isCompleted = newCollected >= targetCampaign.target;
      const updatedStatus = isCompleted ? 'Completed' : targetCampaign.status;
      const updatedStatusColor = isCompleted ? COLORS.GREEN_TEXT : targetCampaign.statusColor;
      const updatedStatusBg = isCompleted ? COLORS.GREEN_BG : targetCampaign.statusBg;

      try {
        await fetch(`${API_URL}/update_campaign_progress.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            collected: newCollected,
            status: updatedStatus,
            status_color: updatedStatusColor,
            status_bg: updatedStatusBg,
          }),
        });
      } catch (e) {
        console.log('Offline collection update fallback');
      }

      const updated = campaignsList.map((camp) => {
        if (camp.id === id) {
          return {
            ...camp,
            collected: newCollected,
            status: updatedStatus,
            statusColor: updatedStatusColor,
            statusBg: updatedStatusBg,
          };
        }
        return camp;
      });

      setCampaignsList(updated);
      await AsyncStorage.setItem('campaignsList', JSON.stringify(updated));

      if (newCollected >= targetCampaign.target && targetCampaign.collected < targetCampaign.target) {
        setTimeout(() => {
          Alert.alert(
            '🏆 Target Completed!',
            `Congratulations! Your campaign "${targetCampaign.title}" has successfully reached 100% of its target collection goal!`
          );
        }, 300);
      }
    } catch (e) {
      console.log('Error updating campaign collections: ', e);
    }
  };

  const handleSaveCollection = async () => {
    if (!selectedCampaign) return;
    await updateProgress(selectedCampaign.id, unitsToAdd);
    setShowLogModal(false);
  };

  const filteredCampaigns = campaignsList.filter((camp) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return camp.collected < camp.target;
    if (activeTab === 'Closed') return camp.collected >= camp.target;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>Campaigns</Text>
          <Text style={styles.topbarSub}>Blood donation drives</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewCampaign')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {(['All', 'Active', 'Closed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {filteredCampaigns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No drives found under this section.</Text>
          </View>
        ) : (
          filteredCampaigns.map((camp) => {
            const progressPercent = Math.min((camp.collected / camp.target) * 100, 100);
            return (
              <TouchableOpacity
                key={camp.id}
                style={styles.card}
                onPress={() => handleOpenDetailModal(camp)}
                activeOpacity={0.9}
              >
                {camp.imageUri ? (
                  <Image source={{ uri: camp.imageUri }} style={styles.cardBanner} />
                ) : (
                  <View style={styles.defaultBanner}>
                    <Ionicons name="water" size={32} color="rgba(255,255,255,0.4)" />
                  </View>
                )}

                <View style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>{camp.title}</Text>

                      <View style={styles.detailsRow}>
                        <Ionicons name="calendar-outline" size={10} color="#999999" />
                        <Text style={styles.cardSub}>{camp.date}</Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Ionicons name="pin" size={10} color={COLORS.PRIMARY} />
                        <Text style={[styles.cardSub, { color: COLORS.TEXT_DARK, fontWeight: '500' }]}>
                          {camp.place || 'Hospital Auditorium'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: camp.statusBg }]}>
                      <Text style={[styles.badgeText, { color: camp.statusColor }]}>{camp.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardDesc}>{camp.description}</Text>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>

                    <View style={styles.cardFooterRow}>
                      <Text style={styles.collectedRatioText}>
                        {camp.collected} / {camp.target} Units Collected ({Math.round(progressPercent)}%)
                      </Text>

                      {progressPercent < 100 ? (
                        <TouchableOpacity
                          style={styles.logButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenLogModal(camp);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="water" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                          <Text style={styles.logButtonText}>Log Collection</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.completedIndicator}>
                          <Ionicons name="checkmark-circle" size={13} color={COLORS.GREEN_TEXT} style={{ marginRight: 3 }} />
                          <Text style={styles.completedIndicatorText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {detailCampaign && (
        <Modal
          visible={showDetailModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailContent}>
              {detailCampaign.imageUri ? (
                <Image source={{ uri: detailCampaign.imageUri }} style={styles.detailBanner} />
              ) : (
                <View style={[styles.defaultDetailBanner, { backgroundColor: COLORS.PRIMARY }]}>
                  <Ionicons name="water" size={48} color="rgba(255,255,255,0.4)" />
                </View>
              )}

              <TouchableOpacity
                style={styles.closeOverlayButton}
                onPress={() => setShowDetailModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.detailPadding}>
                <View style={styles.detailHeaderRow}>
                  <Text style={styles.detailTitle}>{detailCampaign.title}</Text>
                  <View style={[styles.badge, { backgroundColor: detailCampaign.statusBg }]}>
                    <Text style={[styles.badgeText, { color: detailCampaign.statusColor }]}>{detailCampaign.status}</Text>
                  </View>
                </View>

                <View style={styles.detailMetaSection}>
                  <View style={styles.detailMetaRow}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.PRIMARY} style={{ width: 18 }} />
                    <Text style={styles.detailMetaText}>{detailCampaign.date}</Text>
                  </View>
                  <View style={styles.detailMetaRow}>
                    <Ionicons name="pin" size={13} color={COLORS.PRIMARY} style={{ width: 18 }} />
                    <Text style={styles.detailMetaText}>{detailCampaign.place || 'Apollo Hospital Auditorium'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>Drive Target Diagnostics</Text>
                <View style={styles.targetGrid}>
                  <View style={styles.targetCol}>
                    <Text style={styles.targetLabel}>Blood Group</Text>
                    <Text style={styles.targetValue}>
                      {detailCampaign.description.split(' ')[0] || 'All'}
                    </Text>
                  </View>
                  <View style={styles.targetCol}>
                    <Text style={styles.targetLabel}>Target Units</Text>
                    <Text style={styles.targetValue}>{detailCampaign.target} Bags</Text>
                  </View>
                  <View style={styles.targetCol}>
                    <Text style={styles.targetLabel}>Collected</Text>
                    <Text style={[styles.targetValue, { color: COLORS.GREEN_TEXT }]}>
                      {detailCampaign.collected} Bags
                    </Text>
                  </View>
                </View>

                <View style={styles.detailProgressContainer}>
                  <View style={styles.detailProgressHeader}>
                    <Text style={styles.detailProgressLabel}>Target Goal Progress</Text>
                    <Text style={styles.detailProgressPercent}>
                      {Math.round(Math.min((detailCampaign.collected / detailCampaign.target) * 100, 100))}%
                    </Text>
                  </View>

                  <View style={styles.detailProgressBarBg}>
                    <View
                      style={[
                        styles.detailProgressBarFill,
                        { width: `${Math.min((detailCampaign.collected / detailCampaign.target) * 100, 100)}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.unitsLeftText}>
                    {detailCampaign.collected >= detailCampaign.target
                      ? '🎉 Target Achieved! Great job!'
                      : `🩸 ${detailCampaign.target - detailCampaign.collected} units left to collect`}
                  </Text>
                </View>

                <View style={styles.detailActionRow}>
                  {detailCampaign.collected < detailCampaign.target && (
                    <TouchableOpacity
                      style={styles.detailPrimaryButton}
                      onPress={() => {
                        setShowDetailModal(false);
                        setTimeout(() => handleOpenLogModal(detailCampaign), 350);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="water" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.detailPrimaryButtonText}>Log Collection</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.detailSecondaryButton, { flex: detailCampaign.collected < detailCampaign.target ? 0.5 : 1 }]}
                    onPress={() => setShowDetailModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailSecondaryButtonText}>Close Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {selectedCampaign && (
        <Modal
          visible={showLogModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLogModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.logContent}>
              <View style={styles.logHeader}>
                <Text style={styles.logTitle}>Log Blood Units</Text>
                <TouchableOpacity onPress={() => setShowLogModal(false)}>
                  <Ionicons name="close" size={20} color="#888888" />
                </TouchableOpacity>
              </View>

              <Text style={styles.logSubTitle}>{selectedCampaign.title}</Text>

              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setUnitsToAdd(Math.max(1, unitsToAdd - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>

                <View style={styles.stepValueBox}>
                  <Text style={styles.stepValueText}>+{unitsToAdd}</Text>
                  <Text style={styles.stepValueUnit}>Bags / Units</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setUnitsToAdd(unitsToAdd + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.saveLogBtn}
                onPress={handleSaveCollection}
                activeOpacity={0.8}
              >
                <Text style={styles.saveLogBtnText}>Save Collection ({selectedCampaign.collected + unitsToAdd}/{selectedCampaign.target})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContainer: {
    paddingTop: 60,
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
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardBanner: {
    width: '100%',
    height: 120,
  },
  defaultBanner: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPadding: {
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardSub: {
    fontSize: 10,
    color: '#888888',
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
  cardDesc: {
    fontSize: 11,
    color: '#666666',
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  collectedRatioText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555555',
  },
  logButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.GREEN_TEXT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  detailBanner: {
    width: '100%',
    height: 160,
  },
  defaultDetailBanner: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeOverlayButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPadding: {
    padding: 16,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  detailMetaSection: {
    marginTop: 8,
    gap: 4,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailMetaText: {
    fontSize: 11,
    color: '#666666',
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.BORDER,
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  targetGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 8,
    padding: 10,
  },
  targetCol: {
    flex: 1,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 9,
    color: '#888888',
  },
  targetValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginTop: 2,
  },
  detailProgressContainer: {
    marginTop: 12,
  },
  detailProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailProgressLabel: {
    fontSize: 10,
    color: '#666666',
  },
  detailProgressPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  detailProgressBarBg: {
    height: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailProgressBarFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  unitsLeftText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  detailPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    height: 42,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailSecondaryButton: {
    backgroundColor: '#F0F0F0',
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSecondaryButtonText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
  },
  logContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  logSubTitle: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 20,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  stepValueBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepValueText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  stepValueUnit: {
    fontSize: 10,
    color: '#999999',
  },
  saveLogBtn: {
    backgroundColor: COLORS.PRIMARY,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLogBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
