import { createAgent, tool } from "langchain";
import z from "zod"
import "dotenv/config"
import { convertResponsesMessageToAIMessage } from "@langchain/openai";


const getUserLocation = tool((_,config) => {

    const user_id = config.context.user_id;
    return user_id === "1" ? "Florida" : "SFO"

},
    {
        name: "get_user_location",
        description: "Rerieve user information based on User ID",
        schema: z.object({})
    }
)

const getWeather = tool((input) => {

    return `It's sunny in ${input.city}`

},
    {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({
            city: z.string()
        })
    }
);

const config = {
    context: { user_id: "1" }
}

const agent = createAgent(
    {
        model: "google-genai:gemini-2.5-flash",
        tools: [getUserLocation, getWeather]
    }
)

const response = await agent.invoke({
    messages: [{ role: 'user', content: "What is weather outside?" }]
}, config)

console.log(response.messages)