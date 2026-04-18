const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDr6n3PfD9Th6BeeEmywRkdTDd1rwOna5I");

async function listModels() {
    try {
        // For some SDK versions, listModels might be on the client or a specific manager
        // Checking documentation or common patterns. 
        // Actually, in the Node SDK, it's often not directly exposed on the client instance in older versions, 
        // but let's try the standard way if available, or just try a simple generation with a fallback.

        // Since listModels isn't always straightforward in the helper, let's just try to generate with 'gemini-pro' and 'gemini-1.0-pro' and see which one works.

        const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash-001", "gemini-1.0-pro", "gemini-pro"];

        for (const modelName of modelNames) {
            console.log(`Testing model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`SUCCESS: ${modelName} works!`);
                break;
            } catch (e) {
                console.log(`FAILED: ${modelName} - ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
