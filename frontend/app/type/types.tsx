interface Review {
  id: number;
  userId: number;
  universityId: number;
  rating: number;
  overall: number;
  installations: number;
  uniLife: number;
  accommodation: number;
  academicLevel: number;
  activities: number;
  comment?: string;
}

interface Event {
  id: number;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  capacity?: number;
  visibility?: "PUBLIC" | "PRIVATE"; 
  mentor?: User;
  mentorId?: number;
  groupId?: number;
  attendees?: User[];
}

interface StudentMentor {
  id: number;
  studentId: number;
  mentorId: number;
}

interface Erasmus {
  id: number;
  userId: number;
  universityId: number;
  status: string;
  year: string;
  academicYear?: string;
  duration?: "FIRST_SEMESTER" | "SECOND_SEMESTER" | "FULL_YEAR";
  shareInfo?: boolean;
}

type MentorAvailability = Array<{
  id: number;
  mentorId: number;
  dayOfWeek: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
  createdAt: Date;
  updatedAt: Date;
  mentor: { 
    id: number; 
    email: string; 
    name: string; 
    role: string; 
  };
}>;

interface WeeklyAvailability {
  [key: number]: {
    dayName: string;
    slots: {
      id: number;
      startTime: string; // Format: "HH:MM"
      endTime: string;   // Format: "HH:MM"
    }[];
  };
}

interface User {
    id: number;
    email: string;
    name: string;
    password: string;
    role: "STUDENT" | "ADMIN" | "MENTOR" | "FUTURE_STUDENT" | "FORMER_STUDENT";
    universityId?: number;
    erasmusUniversityId?: number;
    erasmusYear?: string;
    degree?: string;
    openToContact: boolean;
    createdAt: Date;
    updatedAt: Date;

    university?: University;
    erasmusUniversity?: University;
    erasmuses?: Erasmus[];
    reviews?: Review[];
    hostedEvents?: Event[];
    attending?: Event[];
    mentorAvailability?: MentorAvailability[];
}

interface University {
    id: string;
    name: string;
    cityId: number;
    countryId: number;
    isPublic: boolean;
}

interface RatingAggregate {
    id: string;
    universityId: string;
    reviewsCount: number;
    overallAvg: number;
    installationsAvg: number;
    uniLifeAvg: number;
    accommodationAvg: number;
    academicLevelAvg: number;
    activitiesAvg: number;  
}

interface ForumTopic {
    id: number;
    universityId: number;
    title: string;
    category: string;
    isPinned: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    _count?: {
        posts: number;
    };
    posts?: ForumPost[];
}

interface ForumPost {
    id: number;
    topicId: number;
    userId: number;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    user: {
        id: number;
        name: string;
        role: string;
    };
}

interface City {
    id: number;
    name: string;
    countryId: number;
    description?: string;
    latitude?: number;
    longitude?: number;
    northSouth?: string;
    eastWest?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

interface Country {
    id: number;
    name: string;
    code: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

interface CityForumTopic {
    id: number;
    cityId: number;
    title: string;
    category: string;
    isPinned: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    _count?: {
        posts: number;
    };
    posts?: CityForumPost[];
}

interface CityForumPost {
    id: number;
    topicId: number;
    userId: number;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    user: {
        id: number;
        name: string;
        role: string;
    };
}

interface MentorGroupForumTopic {
    id: number;
    mentorId: number;
    title: string;
    category: string;
    isPinned: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    _count?: {
        posts: number;
    };
    posts?: MentorGroupForumPost[];
}

interface MentorGroupForumPost {
    id: number;
    topicId: number;
    userId: number;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    user: {
        id: number;
        name: string;
        role: string;
    };
}

interface MentorshipGroup {
    id: number;
    name: string;
    description?: string;
    universityId: number;
    mentorId: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    members?: MentorshipGroupMember[];
    mentor?: {
        id: number;
        name: string;
        email: string;
    };
    _count?: {
        members: number;
    };
    university?: {
        id: number;
        name: string;
    };
}

interface MentorshipGroupMember {
    id: number;
    groupId: number;
    userId: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    group?: {
        name: string;
    };
}

interface AdminStats {
    university: {
        id: number;
        name: string;
    };
    totalStudents: number;
    totalGroups: number;
    studentsInGroups: number;
    studentsNotInGroups: number;
}

interface StudentWithMemberships {
    id: number;
    name: string;
    email: string;
    role: string;
    degree?: string;
    mentorshipGroupMemberships: {
        groupId: number;
        group: {
            name: string;
        };
    }[];
}

interface Mentor {
    id: number;
    name: string;
    email: string;
    mentoringGroups?: {
        id: number;
        name: string;
    }[];
}

export type { User, Erasmus, Event, Review, University, RatingAggregate, MentorAvailability, WeeklyAvailability, ForumTopic, ForumPost, City, CityForumTopic, CityForumPost, Country, MentorGroupForumTopic, MentorGroupForumPost, MentorshipGroup, MentorshipGroupMember, AdminStats, StudentWithMemberships, Mentor };