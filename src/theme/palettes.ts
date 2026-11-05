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
    // New names for colors that were typed directly into screens:
    tint: string; // was #EFEBFF, soft purple fills
    chip: string; // was #E8EAF6, unselected chips
    border: string; // was #D9DCE8, input borders
    unreadBg: string; // was #F3F0FF, unread alert cards
    successBg: string; // was #E3F6E8
    successText: string; // was #1B7A3A and #2E7D32
    placeholder: string; // was #9E9E9E
    white: string; // QR code box stays white in both themes
    category: {
      Cultural: string;
      'Guest Lecture': string;
      Workshop: string;
      Technical: string;
    };
  };
  
  export const lightColors: Palette = {
    primary: '#6C5CE7',
    primaryDark: '#512DA8',
    accent: '#FF4081',
    background: '#F8F9FE',
    authBackground: '#F4F7FF',
    surface: '#FFFFFF',
    text: '#1C1B1F',
    textMuted: '#757575',
    divider: '#EEEEEE',
    error: '#D32F2F',
    mandatoryBg: '#FFCDD2',
    mandatoryText: '#D32F2F',
    tint: '#EFEBFF',
    chip: '#E8EAF6',
    border: '#D9DCE8',
    unreadBg: '#F3F0FF',
    successBg: '#E3F6E8',
    successText: '#1B7A3A',
    placeholder: '#9E9E9E',
    white: '#FFFFFF',
    category: {
      Cultural: '#FF4081',
      'Guest Lecture': '#6C5CE7',
      Workshop: '#FF9800',
      Technical: '#2196F3',
    },
  };
  
  export const darkColors: Palette = {
    primary: '#7B6CF0',
    primaryDark: '#B3A9FF',
    accent: '#FF5C93',
    background: '#121118',
    authBackground: '#121118',
    surface: '#1E1C26',
    text: '#ECEAF4',
    textMuted: '#A19FAE',
    divider: '#2E2B3A',
    error: '#EF5350',
    mandatoryBg: '#4A1F24',
    mandatoryText: '#FF8A80',
    tint: '#2A2640',
    chip: '#2B2938',
    border: '#3A3748',
    unreadBg: '#272243',
    successBg: '#1B3A26',
    successText: '#6FD58C',
    placeholder: '#6F6D7B',
    white: '#FFFFFF',
    category: {
      Cultural: '#FF5C93',
      'Guest Lecture': '#9A8DF5',
      Workshop: '#FFA726',
      Technical: '#42A5F5',
    },
  };