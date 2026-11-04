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
};

export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year'];
export const CLUBS = ['None', 'ACM', 'BRCS', 'NDLD', 'Other'];