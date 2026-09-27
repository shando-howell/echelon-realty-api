import { realEstateAgent } from "./aiService.js";

export const generateAgentStream = async (prompt: string, history: any[]) => {
    // Format the history here if LangGraph needs it in a specific shape
    const agentInput = {
        messages: [
            ...history,
            { role: "user", content: prompt }
        ]
    };

    // Return the streamEvents iterator to the controller
    // Version "v1" is required by LangChain to getb the granualr event stream
    const stream = await realEstateAgent.streamEvents(agentInput, { version: "v1" });

    return stream;
}