import { createAgent, initChatModel, tool, } from "langchain";
import z from "zod"
import "dotenv/config"
import { MemorySaver } from "@langchain/langgraph"
import { threadId } from "worker_threads";


const systemPrompt = `You are an expert weather forcaster who also speaks humourous way.

You have access to two tools:

- get_weather_location: Use this to get the weather for a specific location
- get_user_location: Use this to get the user's location

If a user asks you for the weather, make sure you know the location first. 
If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;

const getUserLocation = tool((_, config) => {

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
    configurable: { thread_id: "1" },
    context: { user_id: "3" }
}

const qaConfig = {
    configurable: { thread_id: "2" },
    context: { user_id: "1" }
}

const responseFormat = z.object({
    humour_response: z.string(),
    weather_conditions: z.string()
})

const model = await initChatModel(
    "google-genai:gemini-2.5-flash",
    {
        temperature: 0.7,
        timeout: 30,
        max_tokens: 1000
    }
)
const checkpointer = new MemorySaver()

const agent = createAgent(
    {
        model: model,
        tools: [getUserLocation, getWeather],
        systemPrompt,
        responseFormat,
        checkpointer
    }
)

const response = await agent.invoke({
    messages: [{ role: 'user', content: "What is weather outside?" }]
}, config)
console.log(response.structuredResponse.humour_response + response.structuredResponse.weather_conditions)

const response1 = await agent.invoke({
    messages: [{ role: 'user', content: "What location did you just tell me about?" }]
}, config)
console.log(response1.structuredResponse.humour_response + response1.structuredResponse.weather_conditions)

const response2 = await agent.invoke({
    messages: [{ role: 'user', content: "Suggest me good places in that location" }]
}, config)
console.log(response2.structuredResponse.humour_response + response2.structuredResponse.weather_conditions)

const response3 = await agent.invoke({
    messages: [{ role: 'user', content: "Suggest me good places in that location" }]
}, qaConfig)

// console.log(response.messages[response.messages.length-1].content)
console.log(response3.structuredResponse.humour_response + response3.structuredResponse.weather_conditions)