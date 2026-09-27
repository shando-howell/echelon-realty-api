import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { searchPropertiesTool } from "./aiTools.js";

// Define the AI tools
const tools = [searchPropertiesTool];
const toolNode = new ToolNode(tools);

// Initialzie the LLM and bind the tools to it
const model = new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-4o-mini",
}).bindTools(tools);

// The Node function that calls the LLM (To add OPENAI credits)
async function callModel(state: typeof MessagesAnnotation.State) {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
}

// The conditional edge for the state graph (does the AI want use a tool?)
function shouldContinue(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) {
        // End the graph
        return "__end__";
    }

    // If the LLM makes a tool call, route to the "tools" node
    if (lastMessage.additional_kwargs?.tool_calls) {
        return "tools";
    } else {
        // End the graph
        return "__end__";
    }
}

// The state graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue) // Decide: use tool or finish?
    .addEdge("tools", "agent"); // After using the tool, send data back to the agent

// Compiling the graph into a runnable app
export const realEstateAgent = workflow.compile();

// Helper function to run the agent from the controller
export async function processUserMessage(message: string) {
    const finalState = await realEstateAgent.invoke({
        messages: [new HumanMessage(message)],
    });
    const aiMessage = finalState.messages[finalState.messages.length - 1];

    // Search the state to find the tool's raw data
    const toolMessage = finalState.messages.find(msg => msg._getType() === 'tool');

    let propertyData = [];

    if (toolMessage) {
        const contentString = typeof toolMessage.content === 'string' 
            ? toolMessage.content
            : (toolMessage.content[0] as any)?.text || "[]";

        try {
            propertyData = JSON.parse(contentString);
        } catch (error) {
            console.error("Failed to parse tool JSON:", error);
        }
    }

    const finalResponseString = typeof aiMessage?.content === 'string'
        ? aiMessage.content
        : (aiMessage?.content[0]?.text || "Here are the properties I found.");

    // Sent both the chat text and the structured data to the client
    return {
        message: finalResponseString,
        properties: propertyData
    };
}