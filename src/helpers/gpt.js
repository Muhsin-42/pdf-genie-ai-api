import OpenAI from "openai";
import { GPT_MAX_TOKEN, OPENAI_API_KEY } from "../utils/constants.js";
import { getParsedRedisData, redis } from "./redis.js";
import { getPrompt } from "../utils/index.js";
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const getGptResponse = async (sessionId, pdfContent, userQuestion) => {
  try {
    const parsedHistory = await getParsedRedisData(sessionId + "convo");
    const messages = getPrompt(pdfContent, parsedHistory, userQuestion);

    const response = await openai.chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        stream: true,
        messages,
        max_tokens: GPT_MAX_TOKEN,
      },
      { responseType: "stream" }
    );

    if (response) {
      const updatedHistory = parsedHistory.concat(
        {
          role: "user",
          content: userQuestion,
        },
        {
          role: "system",
          content: response.choices[0].message.content,
        }
      );
      await redis.set(sessionId + "convo", JSON.stringify(updatedHistory));
      return response.choices[0].message.content;
    }
  } catch (error) {
    console.log("GPT ERROR ", error);
  }
};
