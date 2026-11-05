import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from './useEvents';
import { useSavedIds } from './useSavedIds';
import { DEFAULT_PREFS } from '../types';
import { cancelAllReminders, scheduleReminders } from '../services/reminders';

// Keeps the phone's scheduled reminders in step with the saved events and the user's preferences.
export function useReminderSync() {
  const { profile } = useAuth();
  const { events } = useEvents();
  const savedIds = useSavedIds(profile?.uid);

  const allow = profile?.prefs?.allow ?? DEFAULT_PREFS.allow;
  const remindersOn = profile?.prefs?.reminders ?? DEFAULT_PREFS.reminders;
  const lead = profile?.prefs?.leadMinutes ?? DEFAULT_PREFS.leadMinutes;

  useEffect(() => {
    if (!allow || !remindersOn) {
      cancelAllReminders().catch(() => {});
      return;
    }
    // Events that were deleted are not in the list, so they get no reminder.
    const mine = events.filter((e) => savedIds.has(e.eventId));
    scheduleReminders(mine, lead).catch(() => {});
  }, [events, savedIds, allow, remindersOn, lead]);

  // When this screen goes away (log out), remove the reminders.
  useEffect(() => {
    return () => {
      cancelAllReminders().catch(() => {});
    };
  }, []);
}