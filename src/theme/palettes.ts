export type Palette = {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  authBackground: string;
  surface: string;
  text: string;
  textMuted: string;
  divider: string;
  error: string;
  mandatoryBg: string;
  mandatoryText: string;
  tint: string; // soft fills in the main color
  chip: string; // unselected chips
  border: string; // input borders
  unreadBg: string; // unread alert cards
  successBg: string;
  successText: string;
  placeholder: string;
  white: string; // QR code box stays white in both themes
  category: {
    Cultural: string;
    'Guest Lecture': string;
    Workshop: string;
    Technical: string;
  };
};

export const lightColors: Palette = {
  primary: '#1E3A8A',
  primaryDark: '#0B5750',
  accent: '#F59E0B',
  background: '#F5FAF9',
  authBackground: '#F2F8F7',
  surface: '#FFFFFF',
  text: '#14201E',
  textMuted: '#667674',
  divider: '#E3ECEB',
  error: '#D32F2F',
  mandatoryBg: '#FFCDD2',
  mandatoryText: '#D32F2F',
  tint: '#E3F4F1',
  chip: '#E1EEEC',
  border: '#D3E2DF',
  unreadBg: '#EAF7F4',
  successBg: '#E3F6E8',
  successText: '#1B7A3A',
  placeholder: '#93A3A1',
  white: '#FFFFFF',
  category: {
    Cultural: '#E91E63',
    'Guest Lecture': '#5C6BC0',
    Workshop: '#F59E0B',
    Technical: '#1E88E5',
  },
};

export const darkColors: Palette = {
  primary: '#EAB308',
  primaryDark: '#5EEAD4',
  accent: '#FBBF24',
  background: '#0D1514',
  authBackground: '#0D1514',
  surface: '#16211F',
  text: '#E6F2F0',
  textMuted: '#9AB0AC',
  divider: '#25332F',
  error: '#EF5350',
  mandatoryBg: '#4A1F24',
  mandatoryText: '#FF8A80',
  tint: '#16302D',
  chip: '#1E2B29',
  border: '#2D3F3C',
  unreadBg: '#13282A',
  successBg: '#1B3A26',
  successText: '#6FD58C',
  placeholder: '#667876',
  white: '#FFFFFF',
  category: {
    Cultural: '#F06292',
    'Guest Lecture': '#9FA8DA',
    Workshop: '#FBBF24',
    Technical: '#64B5F6',
  },
};