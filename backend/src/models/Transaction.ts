import mongoose, { Document, Schema, Types } from 'mongoose';

export type TransactionStatus = 'pending' | 'accepted' | 'rejected' | 'modified' | 'completed' | 'cancelled';

interface IMessage {
  sender: Types.ObjectId;
  content: string;
  createdAt: Date;
  read: boolean;
  notified: boolean;
}

interface ITerms {
  deliveryMethod: 'in-person' | 'courier' | 'mail';
  duration: number;
  location?: string;
  additionalNotes?: string;
}

export interface ITransaction extends Document {
  book: Types.ObjectId;
  requester: Types.ObjectId;
  owner: Types.ObjectId;
  status: TransactionStatus;
  terms: ITerms;
  messages: IMessage[];
  lastModifiedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'modified', 'completed', 'cancelled'],
    default: 'pending'
  },
  terms: {
    deliveryMethod: {
      type: String,
      required: true,
      enum: ['in-person', 'courier', 'mail']
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 90
    },
    location: String,
    additionalNotes: String
  },
  messages: [{
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

transactionSchema.index({ requester: 1, status: 1 });
transactionSchema.index({ owner: 1, status: 1 });
transactionSchema.index({ book: 1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);