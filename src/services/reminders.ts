import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { EventItem } from '../types';

const CHANNEL_ID = 'reminders';
const MAX_SCHEDULED = 50; // phones allow only a limited number of scheduled notifications

// Call once when the app starts.
export function configureNotifications() {
  // Show reminders even while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Android needs a channel before it will show notifications.
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Event reminders',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// Runs one job at a time, so two quick changes cannot leave a stray reminder behind.
let queue: Promise<unknown> = Promise.resolve();
function enqueue(job: () => Promise<void>): Promise<void> {
  const next = queue.then(job, job);
  queue = next.catch(() => {});
  return next;
}

function leadLabel(minutes: number): string {
  if (minutes >= 1440) return 'in 1 day';
  if (minutes >= 60) return 'in 1 hour';
  return `in ${minutes} minutes`;
}

// Replaces all scheduled reminders with one for each of these events.
export function scheduleReminders(events: EventItem[], leadMinutes: number): Promise<void> {
  return enqueue(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = Date.now();
    const due = events
      .map((event) => ({ event, at: event.startTime.toMillis() - leadMinutes * 60 * 1000 }))
      .filter((x) => x.at > now + 5000) // skip reminders whose time has passed
      .sort((a, b) => a.at - b.at)
      .slice(0, MAX_SCHEDULED);

    if (due.length === 0) return;
    if (!(await ensurePermission())) return;

    for (const { event, at } of due) {
      await Notifications.scheduleNotificationAsync({
        identifier: `reminder_${event.eventId}`,
        content: {
          title: `Reminder: ${event.title}`,
          body: `Starts ${leadLabel(leadMinutes)} at ${event.venue}.`,
          data: { eventId: event.eventId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(at),
          channelId: CHANNEL_ID,
        },
      });
    }
  });
}

export function cancelAllReminders(): Promise<void> {
  return enqueue(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  });
}