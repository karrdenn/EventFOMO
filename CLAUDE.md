You are helping me build EventFOMO, a cross-platform (Android + iOS) campus event app for the College of Science and Technology, Bhutan, using React Native (Expo, TypeScript).

Stack: Expo + TypeScript, React Navigation (bottom tabs + native stack), Firebase JS SDK v10+ (modular: Auth and Firestore only; NO Firebase Storage), Cloudinary unsigned upload via fetch/FormData for images and PDFs, expo-camera, react-native-qrcode-svg, expo-notifications, expo-calendar, expo-image-picker, expo-document-picker, expo-file-system, expo-sharing, expo-crypto, react-native-calendars, AsyncStorage, NetInfo.

Roles: users.role is "student" or "staff". both students and staff check in. ANY signed-in user (student or staff) can create events; the creator is the event's organizer (events.organizerId == their uid), and only the organizer can edit/delete the event, show its QR, and view its attendance. There is no organizer approval flow.

Firestore:
- users/{uid}: fullName, studentId, email, role, year, club, photoUrl, expoPushToken, prefs{allow,newEvents,reminders,mandatory,updates,leadMinutes}, createdAt
- events/{id}: eventId, title, description, category(Technical|Cultural|Guest Lecture|Workshop), venue, startTime, endTime (Timestamp), speakerName, coverImageUrl, organizerId, organizerName, isMandatory, mandatoryFor[], attendeeCount, scheduleType('pdf'|'text'|''), scheduleContent (PDF url or text), createdAt
- savedEvents/{uid_eventId}: userId, eventId, savedAt, status('saved'|'attended'), attendedAt, title, category, startTime, endTime, venue, isMandatory
- notifications/{id}: userId (uid or "all"), title, body, type(new_event|reminder|mandatory|update), relatedEventId, createdAt, isRead
- For secure QR check-in: events/{id}/qr/current {token, expiresAt} and events/{id}/checkins/{uid} {fullName, studentId, checkedInAt, token}

Design: primary #6C5CE7, dark purple #512DA8, accent pink #FF4081, background #F8F9FE, auth background #F4F7FF, text #1C1B1F, category colours Cultural #FF4081 / Guest Lecture #6C5CE7 / Workshop #FF9800 / Technical #2196F3, mandatory chip bg #FFCDD2 text #D32F2F. Rounded cards, clean modern look.

Rules: strict TypeScript, functional components + hooks, feature folders (src/features/auth, events, calendar, attendance, notifications, profile; src/services; src/components; src/navigation; src/theme). Loading, empty and error states on every screen. Never hardcode keys: use EXPO_PUBLIC_ env vars (Firebase and Cloudinary). After each task, list files changed and how to test.
