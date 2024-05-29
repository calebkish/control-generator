import { Chat, ChatSchemaV1, Control, ControlsToChats, LlmConfigAzureOpenAiOption, LlmConfigLocalLlamaOption, LlmConfigOption, LlmConfigType } from '../db/schema.js';

export {
  ControlSchemaV1,
  ChatSchemaV1,
  Control,
  Chat,
  ControlsToChats,
  LlmConfigOption,
  LlmConfigType,
  LlmConfig,
  User,
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
  type: ControlsToChats['chatType'];
}

export type LlmConfigOptionResponse = {
  option: LlmConfigLocalLlamaOption;
  type: 'LOCAL_LLAMA_V1';
} | {
  option: LlmConfigAzureOpenAiOption;
  type: 'AZURE_OPENAI_V1';
};

export type ConfigVm = {
  id: number;
  isActive: boolean;
  option: string;
};
