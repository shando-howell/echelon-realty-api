import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { propertyService } from "./propertyService.js";

export const searchPropertiesTool = tool(
    async ({ longitude, latitude, radiusMiles }) => {
        console.log(`AI called tool with arguments: ${longitude}, ${latitude}, ${radiusMiles}`)

        try {
            const properties = await propertyService.findPropertiesWithinRadius(
                longitude,
                latitude,
                radiusMiles
            );

            if (properties.length === 0) {
                return "No properties found within that radius.";
            }

            // Return the JSON data as a string for the AI to read
            return JSON.stringify(properties);
        } catch (error) {
            console.error("Tool execution failed:", error);
            return "Error executing property search.";
        }
    },
    {
        name: "search_properties_by_radius",
        description: `
            Searches for properties within a given radius.
            IMPORTANT GUIDE FOR JAMAICA:
            - Kingston: lat 18.0179, lng -76.8099
            - St. Elizabeth (Treasure Beach): lat 17.8760, lng -77.7610
            - Montego Bay: lat 18.4714, lng -77.9229
            Always use these exact coordinates if the user asks for these locations.
            Default to a 5-mile radius if not specified.
        `,
        schema: z.object({
            longitude: z.number().describe("The longitude coordinate of the center point."),
            latitude: z.number().describe("The latitude coordinate of the center point."),
            radiusMiles: z.number().describe("The search radius in miles"),
        }),
    }
);