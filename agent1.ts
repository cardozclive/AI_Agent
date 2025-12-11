import { createAgent, tool } from "langchain";
import "dotenv/config"
import z from "zod";

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

const getTime = tool((input) => {

    return `The current time in ${input.city} is 15:00 P.M.`

},
    {
        name: "get_time",
        description: "Get current time for a given city",
        schema: z.object({
            city: z.string()
        })
    }
)


const agent = createAgent(
    {
        model: "google-genai:gemini-2.5-flash",
        // model: "deepseek-reasoner",
        tools: [getWeather, getTime]
    }
);

const response = await agent.invoke({
    // messages: [{role: "user", content: "What is the weather in london city"}]
    // messages: [{role: "user", content: "What is the weather in london city"}]
    messages: [{ role: "user", content: "What is the weather & time in london city" }]
});

// console.log(response);

const longMessage = response.messages[response.messages.length - 1].content
console.log(longMessage); 