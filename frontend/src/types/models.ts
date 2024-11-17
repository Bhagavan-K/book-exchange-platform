export type BookCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
export type BookStatus = 'available' | 'pending' | 'exchanged';
export type BookLocation = 'Mumbai' | 'Delhi' | 'Bangalore' | 'Chennai' | 'Hyderabad' | 'All';

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  location?: BookLocation;
  profileImage?: string;
  preferences: {
    genres: string[];
  };
  reputation?: number;
  createdAt?: string;
}

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  location?: BookLocation;
  preferences?: {
    genres: string[];
  };
  currentPassword?: string;
  newPassword?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  condition: BookCondition;
  status: BookStatus;
  location: BookLocation;
  description?: string;
  owner: User;
  createdAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface BookResponse {
  books: Book[];
  pagination: PaginationInfo;
}

export interface BookUpdateData {
  title?: string;
  author?: string;
  genre?: string;
  condition?: BookCondition;
  location?: BookLocation;
  description?: string;
  status?: BookStatus;
}

export interface UserUpdateData extends Partial<Omit<User, 'id' | 'email' | 'preferences'>> {
  preferences?: {
    genres: string[];
  };
  currentPassword?: string;
  newPassword?: string;
}

export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'modified' | 'completed' | 'cancelled';
export type DeliveryMethod = 'in-person' | 'courier' | 'mail';

export interface ExchangeTerms {
  deliveryMethod: DeliveryMethod;
  duration: number;
  location?: BookLocation;
  additionalNotes?: string;
}

export interface ExchangeMessage {
  id: string;
  sender: User;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Exchange {
  id: string;
  book: Book;
  requester: User;
  owner: User;
  status: ExchangeStatus;
  terms: ExchangeTerms;
  messages: ExchangeMessage[];
  lastModifiedBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface BookApiResponse {
  books: Book[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  content: string;
  createdAt: string;
  read: boolean;
  notified: boolean;
}
