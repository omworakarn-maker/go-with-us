

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: 'Budget' | 'Moderate' | 'Luxury';
  participants: Participant[];
  maxParticipants: number;
  itinerary?: DayPlan[];
  category?: string;
  creatorId?: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Participant {
  id: string;
  name: string;
  interests: string[];
  dietaryRestrictions?: string;
}

export interface DayPlan {
  day: number;
  activities: Activity[];
}

export interface Activity {
  time: string;
  name: string;
  location: string;
  description: string;
}

export interface AIRecommendation {
  summary: string;
  itinerary: DayPlan[];
  groupAnalysis: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId?: string;
  tripId?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Conversation {
  user: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage: Message;
}
