import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: 100,
    },
    messages: [messageSchema],
    subject: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate title from first user message
conversationSchema.pre('save', function (next) {
  if (this.messages.length > 0 && this.title === 'New Conversation') {
    const firstUserMsg = this.messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      this.title = firstUserMsg.content.substring(0, 60).trim();
      if (firstUserMsg.content.length > 60) this.title += '...';
    }
  }
  this.messageCount = this.messages.length;
  next();
});

export const Conversation = mongoose.model('Conversation', conversationSchema);
