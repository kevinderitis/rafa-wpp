import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  session: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
});

const SessionModel = mongoose.model('Session', SessionSchema);

export default SessionModel;