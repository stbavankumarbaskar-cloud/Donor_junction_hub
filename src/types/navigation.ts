import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Campaigns: undefined;
  Map: undefined;
  Chat: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  OTP: { mobile: string };
  Register: { mobile: string };
  Pending: { mobile?: string; orgName?: string };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  NewCampaign: undefined;
  CampaignDone: { campaignId?: string; title?: string };
  DonorList: { bloodGroup?: string; location?: string };
  Inquiry: { inquiryId?: string };
  ChatDetail: {
    id?: string;
    name: string;
    bloodType?: string;
    status?: string;
    avatar?: string;
  };
  SuperAdmin: undefined;
};
