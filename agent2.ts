import { createAgent, tool, toolStrategy } from "langchain";
import z from "zod"
import "dotenv/config"
import { convertResponsesMessageToAIMessage } from "@langchain/openai";


const systemPrompt = `You are an expert weather forcaster.

You have access to two tools:

- get_weather_location: Use this to get the weather for a specific location
- get_user_location: Use this to get the user's location

If a user asks you for the weather, make sure you know the location first. 
If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;

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
        name: "get_weather_location",
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
        tools: [getUserLocation, getWeather],
        systemPrompt
    }
)

const response = await agent.invoke({
    messages: [{ role: 'user', content: "What is weather outside?" }]
}, config)

console.log(response.messages[response.messages.length-1].content)