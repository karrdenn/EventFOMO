import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_PREFS, UserProfile } from '../types';

// Gets this phone's push token and saves it on the user's profile.
export async function registerForPush(uid: string): Promise<void> {
  if (!Device.isDevice) {
    console.log('PUSH: not a real device');
    return; // simulators cannot receive push
  }

  let status = (await Notifications.getPermissionsAsync()).status;
  console.log('PUSH: permission is', status);
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
    console.log('PUSH: after asking, permission is', status);
  }
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  console.log('PUSH: projectId found?', !!projectId);
  if (!projectId) {
    console.warn('Push: no projectId. Run "npx eas-cli init".');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  console.log('PUSH: token received, saving');
  await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
  console.log('PUSH: saved');
}

type PushEvent = {
  title: string;
  category: string;
  isMandatory: boolean;
  mandatoryFor: string[];
};

// Sends a push to everyone who should hear about a new event.
// includeSelf is only for testing on one phone.
export async function sendEventPush(
  eventId: string,
  event: PushEvent,
  organizerUid: string,
  includeSelf = false
): Promise<void> {
  const snap = await getDocs(collection(db, 'users'));
  const messages: object[] = [];
  const seen = new Set<string>();

  snap.docs.forEach((d) => {
    const u = d.data() as UserProfile;
    if (!u.expoPushToken || seen.has(u.expoPushToken)) return;
    if (u.uid === organizerUid && !includeSelf) return;

    const prefs = { ...DEFAULT_PREFS, ...(u.prefs ?? {}) };
    if (!prefs.allow) return;

    const targeted =
      event.isMandatory &&
      u.role === 'student' &&
      (event.mandatoryFor.length === 0 ||
        event.mandatoryFor.includes(u.year) ||
        (!!u.club && u.club !== 'None' && event.mandatoryFor.includes(u.club)));

    if (targeted && !prefs.mandatory) return;
    if (!targeted && !prefs.newEvents) return;

    seen.add(u.expoPushToken);
    messages.push({
      to: u.expoPushToken,
      sound: 'default',
      title: targeted ? `Mandatory: ${event.title}` : `New Event: ${event.title}`,
      body: targeted
        ? 'You are required to attend this event. Tap for details.'
        : `A new event has been posted in ${event.category}.`,
      data: { eventId },
    });
  });

  console.log('PUSH: messages to send:', messages.length);

  // The push service accepts up to 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
    console.log('PUSH: send response', res.status, await res.text());
  }
}