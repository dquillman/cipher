const { GoogleGenerativeAI } = require("@google/generative-ai");

// Hardcoded key from index.ts for accurate simulation
const API_KEY = "AIzaSyDr6n3PfD9Th6BeeEmywRkdTDd1rwOna5I";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function runTest() {
    console.log("Starting verification test (2.0 Flash) with RETRY logic...");
    const batches = 3;
    const countPerBatch = 5;

    // Simulate finding existing questions (10 stems context)
    const existingStemsContext = [
        "What is the primary output of the Validate Scope process?",
        "Which document defines how requirements will be analyzed, documented, and managed?",
        "You are a project manager. A key stakeholder is upset. What do you do?",
        "What is the formula for Schedule Performance Index (SPI)?",
        "Define the difference between verified deliverables and accepted deliverables.",
        "When should the project charter be approved?",
        "Who is responsible for the project management plan?",
        "What tool is best for analyzing root causes of defects?",
        "Explain the purpose of a Change Control Board (CCB).",
        "What is the main risk of crashing a project schedule?"
    ];

    for (let i = 0; i < batches; i++) {
        const prompt = `
            You are a PMP Exam Question Generator.
            Generate ${countPerBatch} unique, high-quality PMP exam questions about "Risk Management".
            Difficulty: Medium.
            
            Return ONLY a raw JSON array of objects. Do not include markdown formatting (like \`\`\`json).
            Each object must have:
            - stem: The question text (scenario-based).
            - options: Array of 4 strings.
            - correctAnswer: Index of the correct option (0-3).
            - explanation: Detailed explanation.
            - domain: "Process".
            - difficulty: "Medium".

            CRITICAL: Do NOT generate questions identical or very similar to these existing ones:
            ${JSON.stringify(existingStemsContext)}
        `;

        let retries = 0;
        let success = false;

        while (!success && retries < 3) {
            try {
                const start = Date.now();
                console.log(`[Batch ${i + 1}/${batches}] Sending request (Attempt ${retries + 1})...`);

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                const duration = (Date.now() - start) / 1000;
                console.log(`[Batch ${i + 1}/${batches}] Success! Took ${duration.toFixed(2)}s`);
                console.log(`Response length: ${text.length} chars`);
                success = true;

            } catch (error) {
                if (error.message.includes("429") || error.message.includes("Quota exceeded")) {
                    retries++;
                    console.warn(`[Batch ${i + 1}] Rate limit hit. Waiting 60s before retry ${retries}...`);
                    await new Promise(resolve => setTimeout(resolve, 60000));
                } else {
                    console.error(`[Batch ${i + 1}/${batches}] FAILED fatal error:`, error.message);
                    process.exit(1);
                }
            }
        }

        if (!success) {
            console.error(`[Batch ${i + 1}] Failed after 3 retries.`);
            process.exit(1);
        }

        // Wait between batches too, to be safe (45s)
        if (i < batches - 1) {
            console.log("Waiting 45 seconds between batches...");
            await new Promise(resolve => setTimeout(resolve, 45000));
        }
    }

    console.log("VERIFICATION COMPLETE: All batches succeeded (possibly with retries).");
}

runTest();
