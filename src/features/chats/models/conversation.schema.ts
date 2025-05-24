import { IConvertionDocument } from '@chats/interfaces/conversation.interface';
import mongoose, { Model, model, Schema } from 'mongoose';

const conversationSchema: Schema = new Schema({
	senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const ConversationModel: Model<IConvertionDocument> = model<IConvertionDocument>(
	'Conversation',
	conversationSchema,
	'Conversation'
);

export { ConversationModel };
