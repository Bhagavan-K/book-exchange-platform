import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export type BookCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
export type BookStatus = 'available' | 'pending' | 'exchanged';
export type BookLocation = 'Mumbai' | 'Delhi' | 'Bangalore' | 'Chennai' | 'Hyderabad' | 'All';

export interface IBookDocument extends Document {
  title: string;
  author: string;
  genre: string;
  description?: string;
  condition: BookCondition;
  location: BookLocation;
  owner: mongoose.Types.ObjectId | IUser;
  status: BookStatus;
  createdAt: Date;
}

export interface IBook extends Omit<IBookDocument, 'owner'> {
  owner: IUser;
}

const bookSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  location: {
    type: String,
    required: true,
    enum: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'exchanged'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookSchema.index({ location: 1, status: 1 });
bookSchema.index({ genre: 1, status: 1 });

const Book = mongoose.model<IBookDocument>('Book', bookSchema);

export default Book;