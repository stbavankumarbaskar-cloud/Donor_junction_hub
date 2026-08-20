export interface Organization {
  id: string;
  name: string;
  category: 'Hospital' | 'NGO' | 'Blood Bank' | 'Other';
  licenseNo: string;
  phone: string;
  email: string;
  address: string;
  status: 'pending' | 'approved' | 'declined';
  documentUri?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  hospitalName: string;
  bloodGroup: string;
  unitsNeeded: number;
  unitsCollected: number;
  location: string;
  urgency: 'Critical' | 'Urgent' | 'Normal';
  deadline: string;
  description?: string;
  status: 'Active' | 'Completed' | 'Cancelled';
}

export interface Donor {
  id: string;
  name: string;
  bloodGroup: string;
  distanceKm: number;
  lastDonated: string;
  phone: string;
  location: string;
  latitude: number;
  longitude: number;
  available: boolean;
}

export interface Inquiry {
  id: string;
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  contactMobile: string;
  urgency: 'Emergency' | 'High' | 'Routine';
  status: 'Open' | 'Fulfilled' | 'In Progress' | 'Closed';
  timestamp: string;
}

export interface ChatThread {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  bloodType?: string;
  status?: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'hub' | 'user';
  text: string;
  time: string;
}
