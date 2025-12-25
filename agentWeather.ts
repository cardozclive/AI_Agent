import { createAgent, tool } from "langchain";
import "dotenv/config";
import z from "zod";

const WEATHER_API_KEY = process.env.WEATHER_API_KEY ?? "c9059d40f7944dc4be190957251512";

async function weather(city: string) {
    if (!WEATHER_API_KEY) {
        throw new Error("Missing WEATHER_API_KEY env var");
    }

    const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=yes`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Weather API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
        location: data.location?.name ?? city,
        country: data.location?.country ?? "",
        lat: data.location?.lat ?? null,
        lng: data.location?.lon ?? null,
        condition: data.current?.condition?.text ?? "Unavailable",
        tempC: data.current?.temp_c ?? null,
        feelsLikeC: data.current?.feelslike_c ?? null,
        humidity: data.current?.humidity ?? null,
        windKph: data.current?.wind_kph ?? null,
    };
}

async function getTimeData(city: string) {
    const weatherData = await weather(city);
    if (!weatherData.lat || !weatherData.lng) {
        throw new Error("Could not get coordinates for city");
    }

    const url = `http://api.timezonedb.com/v2.1/get-time-zone?key=O909FBQ26JMY&format=json&by=position&lat=${weatherData.lat}&lng=${weatherData.lng}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Time API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'OK') {
        throw new Error(data.message || 'Time API error');
    }

    return {
        city: data.cityName || weatherData.location,
        country: data.countryName || weatherData.country,
        time: data.formatted,
        zone: data.zoneName,
        abbreviation: data.abbreviation
    };
}

const getWeather = tool(
    async (input) => {
        const data = await weather(input.city);
        const details = [
            `Condition: ${data.condition}`,
            data.tempC !== null ? `Temp: ${data.tempC}°C (feels like ${data.feelsLikeC}°C)` : null,
            data.humidity !== null ? `Humidity: ${data.humidity}%` : null,
            data.windKph !== null ? `Wind: ${data.windKph} kph` : null,
        ]
            .filter(Boolean)
            .join(", ");

        return `Weather in ${data.location}${data.country ? `, ${data.country}` : ""}: ${details}`;
    },
    {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({
            city: z.string(),
        }),
    }
);

const getTime = tool(
    async (input) => {
        const data = await getTimeData(input.city);
        return `The current time in ${data.city}${data.country ? `, ${data.country}` : ""} is ${data.time} (${data.abbreviation})`;
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
    messages: [{ role: "user", content: "What is the weather & time in Bournemouth city" }]
});

// console.log(response);

const longMessage = response.messages[response.messages.length - 1].content
console.log(longMessage); 
