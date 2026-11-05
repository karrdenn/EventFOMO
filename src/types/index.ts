import { Timestamp } from 'firebase/firestore';

export type Role = 'student' | 'staff';

export type UserPrefs = {
  allow: boolean;
  newEvents: boolean;
  reminders: boolean;
  mandatory: boolean;
  updates: boolean;
  leadMinutes: number; // 15, 60 or 1440
};

export type UserProfile = {
  uid: string;
  fullName: string;
  studentId: string;
  email: string;
  role: Role;
  year: string; // students only, "" for staff
  club: string; // students only, "" for staff
  photoUrl: string;
  expoPushToken: string;
  prefs: UserPrefs;
  createdAt?: Timestamp | null;
};

export type EventItem = {
  eventId: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  startTime: Timestamp;
  endTime: Timestamp;
  speakerName: string;
  coverImageUrl: string;
  organizerId: string;
  organizerName: string;
  isMandatory: boolean;
  mandatoryFor: string[];
  scheduleType: '' | 'pdf' | 'text';
  scheduleContent: string;
  createdAt: Timestamp | null;
};

export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year'];
export const CLUBS = ['None', 'ACM', 'BRCS', 'NDLD', 'Other'];
export const CATEGORIES = ['Technical', 'Cultural', 'Guest Lecture', 'Workshop'];
export const ORGANIZERS = ['ACM', 'BRCS', 'NDLD', 'Department', 'Other'];
export const MANDATORY_GROUPS = [...YEARS, 'ACM', 'BRCS', 'NDLD'];

export const DEFAULT_PREFS: UserPrefs = {
    allow: true,
    newEvents: true,
    reminders: true,
    mandatory: true,
    updates: true,
    leadMinutes: 60,
  };
  
  export type NotificationItem = {
    id: string;
    userId: string;
    eventId: string;
    type: 'new' | 'mandatory';
    title: string;
    body: string;
    isRead: boolean;
    createdAt: Timestamp | null;
  };

  export type CheckinItem = {
    id: string;
    eventId: string;
    userId: string;
    organizerId: string;
    studentName: string;
    studentId: string;
    year: string;
    club: string;
    checkedInAt: Timestamp | null;
  };