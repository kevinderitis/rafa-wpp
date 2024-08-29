import SessionModel from './models/sessionModel.js';
import fs from 'fs';

export default class MongoStore {
  constructor(clientId) {
    this.clientId = clientId;
  }

  async sessionExists(session) {
    const formattedSession = this._formatSession(session.session);
    const count = await SessionModel.countDocuments({ session: formattedSession });
    return count > 0;
  }

  async save(session, data) {
    const formattedSession = this._formatSession(session.session);
    const newSession = new SessionModel({ session: formattedSession, data });
    await newSession.save();
  }

  async load(session) {
    const formattedSession = this._formatSession(session.session);
    const record = await SessionModel.findOne({ session: formattedSession });
    return record ? record.data : null;
  }

async extract({ session, path }) {
    const sessionData = await this.load({ session });
    if (sessionData) {
        const serializedData = JSON.stringify(sessionData);
        const buffer = Buffer.from(serializedData, 'utf-8');
        fs.writeFileSync(path, buffer);
    } else {
        throw new Error(`Session ${session} not found in MongoDB`);
    }
}

  async update(session, data) {
    const formattedSession = this._formatSession(session.session);
    await SessionModel.updateOne({ session: formattedSession }, { $set: { data } });
  }

  async delete(session) {
    const formattedSession = this._formatSession(session.session);
    await SessionModel.deleteOne({ session: formattedSession });
  }

  _formatSession(session) {
    return `${this.clientId}:${session}`;
  }
}

