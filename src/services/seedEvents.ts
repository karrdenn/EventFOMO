import { Timestamp, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Date N days from now at a given hour.
function at(days: number, hour: number): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return Timestamp.fromDate(d);
}

// Adds a few sample events owned by the current user, for testing only.
export async function seedSampleEvents(uid: string, organizerName: string) {
  const samples = [
    {
      title: 'Silver Jubilee Celebration',
      category: 'Cultural',
      venue: 'Convention Hall',
      description: 'Join us to celebrate 25 years of the college.',
      startTime: at(2, 9),
      endTime: at(2, 12),
      isMandatory: true,
      mandatoryFor: ['1st year', '2nd year', '3rd year'],
    },
    {
      title: 'Intro to React Native Workshop',
      category: 'Workshop',
      venue: 'Computer Lab 2',
      description: 'A hands-on session on building your first mobile app.',
      startTime: at(4, 14),
      endTime: at(4, 17),
      isMandatory: false,
      mandatoryFor: [] as string[],
    },
    {
      title: 'Guest Lecture: AI in Bhutan',
      category: 'Guest Lecture',
      venue: 'Auditorium',
      description: 'An invited speaker talks about AI opportunities in Bhutan.',
      startTime: at(6, 10),
      endTime: at(6, 12),
      isMandatory: true,
      mandatoryFor: ['ACM'],
    },
    {
      title: 'Hackathon 2026',
      category: 'Technical',
      venue: 'Innovation Hub',
      description: 'A one-day coding challenge. Teams of three.',
      startTime: at(9, 9),
      endTime: at(9, 18),
      isMandatory: false,
      mandatoryFor: [] as string[],
    },
  ];

  for (const s of samples) {
    const ref = doc(collection(db, 'events'));
    await setDoc(ref, {
      eventId: ref.id,
      ...s,
      speakerName: '',
      coverImageUrl: '',
      organizerId: uid,
      organizerName,
      scheduleType: '',
      scheduleContent: '',
      createdAt: serverTimestamp(),
    });
  }
}