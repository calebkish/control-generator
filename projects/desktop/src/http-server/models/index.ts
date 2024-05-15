import { ChatHistoryItem } from 'node-llama-cpp';
import { Chat, ChatSchemaV1, Control, ControlsToChats } from '../db/schema.js';

export {
  ControlSchemaV1,
  ChatSchemaV1,
  Control,
  Chat,
  ControlsToChats,
} from '../db/schema.js';

export { ChatHistoryItem } from 'node-llama-cpp';

export type ControlWithChats = Control & {
  controlsToChats: ControlsToChats[];
}

export type ControlChatResponse = {
  controlId: Control['id'];
  controlForm: Control['document']['value']['form'];
  chatId: Chat['id'];
  history: ChatSchemaV1['value']['history'];
  // history: Array<ChatHistoryItem & { isGenerating?: boolean }>;
  type: ControlsToChats['chatType'];
}
