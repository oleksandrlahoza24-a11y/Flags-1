/**
 * NexusAI - A custom-built intent classification model.
 * This model uses keyword frequency and pattern matching to classify user input.
 */
const NexusAI = (function() {
    
    // 1. Training Data (Intents)
    // The "Model" learns from these associations
    const knowledgeBase = [
        {
            intent: "greeting",
            keywords: ["hi", "hello", "hey", "greetings", "morning", "evening", "sup"],
            responses: ["Hello there!", "Hi! How can I assist you?", "Greetings, human.", "Hey! What's on your mind?"]
        },
        {
            intent: "identity",
            keywords: ["who", "what", "name", "yourself", "you"],
            responses: ["I am Nexus, a custom AI model built from scratch in JavaScript.", "You can call me Nexus. I don't use any external APIs!"]
        },
        {
            intent: "status",
            keywords: ["how", "are", "you", "doing", "feeling"],
            responses: ["I'm functioning at 100% capacity!", "I'm just a collection of scripts, but I'm doing great!", "All systems go."]
        },
        {
            intent: "capabilities",
            keywords: ["can", "do", "help", "skills", "features"],
            responses: ["I can chat with you, identify intents, and simulate basic intelligence without needing the internet."]
        },
        {
            intent: "joke",
            keywords: ["joke", "funny", "laugh"],
            responses: ["Why did the web developer walk out of a restaurant? Because of the table layout.", "I would tell you a joke about UDP, but you might not get it."]
        },
        {
            intent: "bye",
            keywords: ["bye", "goodbye", "exit", "quit", "later", "stop"],
            responses: ["Goodbye! Have a great day.", "See you later!", "Shutting down conversation... just kidding. Bye!"]
        }
    ];

    // 2. Pre-processing: Tokenizer and Cleaner
    function tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/gi, '') // Remove punctuation
            .split(/\s+/)            // Split into words
            .filter(word => word.length > 1); // Remove tiny filler words
    }

    // 3. Inference Engine: Scoring Algorithm
    function classify(text) {
        const words = tokenize(text);
        let bestIntent = null;
        let highestScore = 0;

        knowledgeBase.forEach(item => {
            let score = 0;
            words.forEach(word => {
                if (item.keywords.includes(word)) {
                    score += 1; // Basic weight
                }
            });

            if (score > highestScore) {
                highestScore = score;
                bestIntent = item;
            }
        });

        return { bestIntent, highestScore };
    }

    // 4. Public API
    return {
        process: function(input) {
            const { bestIntent, highestScore } = classify(input);

            if (bestIntent && highestScore > 0) {
                // Return a random response from the matched intent
                const responses = bestIntent.responses;
                return responses[Math.floor(Math.random() * responses.length)];
            } else {
                // Default fallback for "Unknown" intent
                const fallbacks = [
                    "I'm not sure I understand. Could you rephrase that?",
                    "My current model doesn't have a record for that. Tell me more.",
                    "Interesting... but I don't know how to respond to that yet.",
                    "I am still learning. Can we talk about something else?"
                ];
                return fallbacks[Math.floor(Math.random() * fallbacks.length)];
            }
        }
    };
})();
