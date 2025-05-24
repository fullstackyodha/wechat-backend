import mongoose, { Document } from 'mongoose';

export interface IConvertionDocument extends Document {
	_id: mongoose.Types.ObjectId;
	receiverId: mongoose.Types.ObjectId;
	senderId: mongoose.Types.ObjectId;
}
