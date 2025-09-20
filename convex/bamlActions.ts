"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { b } from "../baml_client";

// Action to generate a random number using BAML and Gemini
export const generateRandomNumberWithBAML = action({
  // Validators for arguments.
  args: {},

  // Action implementation.
  handler: async (ctx) => {
    try {
      //// Call the BAML function to generate a random number
      const result = await b.GenerateRandomNumber();

      console.log("Generated random number with BAML:", result);

      //// Store the generated number in the database
      await ctx.runMutation(api.myFunctions.addNumber, {
        value: result.number,
      });

      return {
        success: true,
        number: result.number,
        message: "Random number generated and stored successfully",
      };
    } catch (error) {
      console.error("Error generating random number with BAML:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unknown error occurred",
        message: "Failed to generate random number",
      };
    }
  },
});
