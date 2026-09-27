import { Request, Response, NextFunction } from 'express';
import { processUserMessage } from '../services/aiService.js';
import { generateAgentStream } from '../services/aiStreamService.js';

class AIController {
    async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { message } = req.body;

            if (!message) {
                res.status(400).json({ error: "Message is required." });
                return;
            }

            console.log(`[AI] Processing message: "${message}`);
            const reply = await processUserMessage(message);

            res.status(200).json({ reply });
        } catch (error) {
            next(error);
        }
    }

    // @ts-expect-error (Implicit any type)
    // SSE controller
    async streamChat(req, res, next) {
        const { prompt, history } = req.body;

        // Set the mandatory SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Flush headers immediately so the client knows the stream has started
        res.flushHeaders();

        try {
            // To be adjusted based on calling agent
            const stream = await generateAgentStream(prompt, history);

            // Loop through the stream and write to the Express response
            for await (const event of stream) {
                // 1. Log EVERY event name that passes through
                // console.log("EVENT FIRED ==> ", event.event);

                // Typically, you want to extract the specific text token from the event
                if (event.event === "on_chat_model_stream" || event.event === "on_llm_stream") {
                    const chunk = event.data.chunk;

                    // Log the raw chunk to see its shape
                    // console.log("RAW CHUNK ==> ", JSON.stringify(chunk));

                    // Failsafe extraction: grab the token wherever LangChain decided to hide it
                    const token = chunk?.content || chunk?.text || chunk?.message?.content || "";

                    if (token) {
                        const payload = { type: "text", token };
                        // console.log("OUTGOING TO CLIENT ==> ", payload);

                        // SSE format requires "data: " followed by the payload, ending with "\n\n"
                        res.write(`data: ${JSON.stringify(payload)}\n\n`);
                    }
                }

                // Intercept the tool completion
                else if (event.event === "on_tool_end") {
                    // Log the tool name
                    console.log("TOOL FIRED. Exact Name ==> ", event.name);
                    console.log("TOOL DATA ==> ", event.data.output);


                    // Check if it's the PostGIS search tool
                    if (event.name === "search_properties_by_radius") {
                        const rawData = event.data.output;

                        console.log("Sending UI Components to client...")

                        res.write(`data: ${JSON.stringify({
                            type: "ui_component",
                            component: "property_cards",
                            data: rawData
                        })}\n\n`);
                    }
                }
            }

            // Signal the end of the stream
            res.write(`data: [DONE]\n\n`);
            res.end();
        } catch (error) {
            console.error("Streaming error:", error);
            res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
        } finally {
            res.end();
        }
    }
}

export const aiController = new AIController();