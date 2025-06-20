import mongoose, { model, Model, Schema } from 'mongoose';
import { IFollowerDocument } from '../interfaces/connections.interface';

const followerSchema: Schema = new Schema({
	followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
	followeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
	createdAt: { type: Date, default: Date.now() }
});

const FollowerModel: Model<IFollowerDocument> = model<IFollowerDocument>(
	'Connections',
	followerSchema,
	'Connections'
);

export { FollowerModel };
