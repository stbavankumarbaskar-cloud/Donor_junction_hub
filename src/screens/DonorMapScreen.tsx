import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, API_URL } from '../constants/theme';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

type DonorMapScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  StackNavigationProp<RootStackParamList>
>;

type DonorMapScreenProps = {
  navigation: DonorMapScreenNavigationProp;
};

const getMapHtml = (initLat: number, initLon: number) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background-color: #FFFFFF;
      }
      #map {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
      .user-dot-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .user-dot {
        width: 12px;
        height: 12px;
        background-color: #4CD964;
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(76, 217, 100, 0.85);
        animation: pulse 1.4s infinite alternate;
      }
      @keyframes pulse {
        0% { transform: scale(0.85); box-shadow: 0 0 4px rgba(76, 217, 100, 0.6); }
        100% { transform: scale(1.3); box-shadow: 0 0 16px rgba(76, 217, 100, 1.0); }
      }
      .donor-marker-pin {
        width: 24px;
        height: 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 10px;
        font-weight: 800;
        border: 2px solid white;
        box-shadow: 0 2.5px 6px rgba(0,0,0,0.3);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map;
      var userMarker;
      var userCircle;
      var donorMarkers = [];

      function startChat(id, name, category, mobile) {
        var msg = JSON.stringify({ type: 'chat', id: id, name: name, category: category, mobile: mobile });
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(msg);
        } else if (window.parent) {
          window.parent.postMessage(msg, '*');
        }
      }

      function makeCall(mobile) {
        var msg = JSON.stringify({ type: 'call', mobile: mobile });
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(msg);
        } else if (window.parent) {
          window.parent.postMessage(msg, '*');
        }
      }

      function initMap() {
        if (typeof L === 'undefined') {
          setTimeout(initMap, 50);
          return;
        }

        map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${initLat}, ${initLon}], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

        userCircle = L.circle([${initLat}, ${initLon}], {
          color: '#4CD964',
          fillColor: '#4CD964',
          fillOpacity: 0.06,
          radius: 10000,
          weight: 1.5,
          dashArray: '6, 6'
        }).addTo(map);

        var userIcon = L.divIcon({
          className: 'user-dot-container',
          html: '<div class="user-dot"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        userMarker = L.marker([${initLat}, ${initLon}], { icon: userIcon }).addTo(map);

        window.addEventListener('message', function(event) {
          try {
            var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (!data) return;
            if (data.type === 'center' || data.type === 'center_map') {
              map.setView([data.lat, data.lon], 12, { animate: true });
            }
          } catch(e){}
        });
      }
      initMap();
    </script>
  </body>
  </html>
`;

export default function DonorMapScreen({ navigation }: DonorMapScreenProps) {
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 13.0601,
    longitude: 80.2506,
  });
  const [loading, setLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const fetchOrgLocation = async () => {
      try {
        const mobile = (await AsyncStorage.getItem('loggedInMobile')) || '9840012345';
        const storedLat = await AsyncStorage.getItem(`orgLatitude_${mobile}`);
        const storedLon = await AsyncStorage.getItem(`orgLongitude_${mobile}`);

        if (storedLat && storedLon) {
          setCurrentLocation({
            latitude: parseFloat(storedLat),
            longitude: parseFloat(storedLon),
          });
        }
      } catch (e) {
        console.log('Error loading map coordinates:', e);
      }
    };

    fetchOrgLocation();
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'chat') {
        navigation.navigate('ChatDetail', { name: data.name, bloodType: 'A+' });
      } else if (data.type === 'call') {
        Linking.openURL(`tel:${data.mobile}`);
      }
    } catch (e) {
      console.log('WebView message error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>Donor & Hospital Map</Text>
          <Text style={styles.topbarSub}>Live 10km radius coverage</Text>
        </View>
        <TouchableOpacity
          style={styles.listNavBtn}
          onPress={() => navigation.navigate('DonorList', { location: 'Chennai' })}
          activeOpacity={0.8}
        >
          <Ionicons name="list" size={16} color="#FFFFFF" />
          <Text style={styles.listNavText}>View List</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallbackContainer}>
            <Ionicons name="map" size={48} color={COLORS.PRIMARY} />
            <Text style={styles.webFallbackTitle}>Interactive Map Ready</Text>
            <Text style={styles.webFallbackSub}>
              Displaying active donors near lat: {currentLocation.latitude.toFixed(4)}, lon: {currentLocation.longitude.toFixed(4)}
            </Text>
            <TouchableOpacity
              style={styles.webListBtn}
              onPress={() => navigation.navigate('DonorList', { location: 'Chennai' })}
            >
              <Text style={styles.webListBtnText}>Browse Donors List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: getMapHtml(currentLocation.latitude, currentLocation.longitude) }}
            onMessage={handleMessage}
            style={{ flex: 1 }}
          />
        )}
      </View>
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
    paddingVertical: 16,
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
  listNavBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listNavText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  webFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  webFallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginTop: 12,
  },
  webFallbackSub: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
  },
  webListBtn: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  webListBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
