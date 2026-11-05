import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';

let handledKey = ''; // stops the same tap from being handled twice

// Opens the event when the user taps a notification (also when it launched the app).
export function useNotificationTap() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const key = `${response.notification.request.identifier}_${response.notification.date}`;
    if (key === handledKey) return;
    handledKey = key;

    const eventId = response.notification.request.content.data?.eventId;
    if (typeof eventId === 'string') {
      navigation.navigate('EventDetails', { eventId });
    }
  }, [response, navigation]);
}