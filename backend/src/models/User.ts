import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  bio?: string;
  location?: 'Mumbai' | 'Delhi' | 'Bangalore' | 'Chennai' | 'Hyderabad';
  profileImage?: string;
  preferences: {
    genres: string[];
  };
  securityAnswers: string[];
  reputation?: number;
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxLength: 500
  },
  location: {
    type: String,
    enum: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad']
  },
  profileImage: {
    type: String
  },
  preferences: {
    genres: [{
      type: String,
      trim: true
    }],
    _id: false
  },
  securityAnswers: {
    type: [String],
    required: true,
    validate: [(val: string[]) => val.length === 3, 'Must provide exactly 3 security answers']
  },
  reputation: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

userSchema.index({ location: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;