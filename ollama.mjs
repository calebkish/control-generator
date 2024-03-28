// import path from "node:path";
// import { LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp";

// const model = new LlamaModel({
//     modelPath: path.join(process.cwd(), "mistral-7b-instruct-v0.2.Q4_K_M.gguf")
// });
// const context = new LlamaContext({ model });
// const session = new LlamaChatSession({ context });


// const q1 = "Hi there, how are you?";
// console.log("User: " + q1);

// const a1 = await session.prompt(q1);
// console.log("AI: " + a1);


// const q2 = "Summerize what you said";
// console.log("User: " + q2);

// const a2 = await session.prompt(q2);
// console.log("AI: " + a2);

import { LlamaCpp } from "@langchain/community/llms/llama_cpp";

// const question = "Where do Llamas come from?";

const llamaPath = 'mistral-7b-instruct-v0.2.Q4_K_M.gguf';
const model = new LlamaCpp({ modelPath: llamaPath });

// console.log(`You: ${question}`);
// const response = await model.invoke(question);
// console.log(`AI : ${response}`);

const prompt = "Tell me a short story about a happy Llama.";

const stream = await model.stream(prompt);

for await (const chunk of stream) {
  console.log(chunk);
}
