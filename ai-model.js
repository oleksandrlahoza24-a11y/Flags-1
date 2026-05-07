/**
 * Custom Generative AI Model
 * Logic: Word-Association Markov Network
 */
const CustomAI = (function() {
    // This is the model's "Neural Network" - a map of word relationships
    let brain = {};
    
    // Initial Seed Data so it knows basic English structure
    const initialKnowledge = [
        "hello how are you today",
        "i am a custom artificial intelligence",
        "i learn from every message you send me",
        "tell me more about yourself",
        "that is very interesting",
        "what do you want to talk about",
        "i can generate sentences on my own",
        "the more we talk the smarter i become"
    ];

    // Function to "Learn" a sentence
    function ingest(sentence) {
        const words = sentence.toLowerCase().replace(/[^\w\s]/g, '').split(' ');
        if (words.length < 2) return;

        for (let i = 0; i < words.length - 1; i++) {
            const current = words[i];
            const next = words[i + 1];

            if (!brain[current]) brain[current] = {};
            if (!brain[current][next]) brain[current][next] = 0;
            
            // Strengthen the connection between these words
            brain[current][next]++;
        }
    }

    // Initialize with seed data
    initialKnowledge.forEach(ingest);

    return {
        // Main function to generate a new sentence
        generateResponse: function(userInput) {
            // First, learn from the user's input (Real-time learning!)
            ingest(userInput);

            const inputWords = userInput.toLowerCase().replace(/[^\w\s]/g, '').split(' ');
            
            // Pick a starting word: either a word from user input or a random word from brain
            let currentWord = inputWords.find(w => brain[w]) || 
                               Object.keys(brain)[Math.floor(Math.random() * Object.keys(brain).length)];
            
            let result = [currentWord];
            let maxSentenceLength = 12;

            for (let i = 0; i < maxSentenceLength; i++) {
                const possibilities = brain[currentWord];
                if (!possibilities) break;

                // Weighted Random Selection: pick next word based on frequency
                const nextWords = Object.keys(possibilities);
                const totalWeight = Object.values(possibilities).reduce((a, b) => a + b, 0);
                
                let randomValue = Math.random() * totalWeight;
                let selectedWord = nextWords[0];

                for (const word in possibilities) {
                    randomValue -= possibilities[word];
                    if (randomValue <= 0) {
                        selectedWord = word;
                        break;
                    }
                }

                result.push(selectedWord);
                currentWord = selectedWord;

                // Simple probability to end sentence early
                if (Math.random() > 0.8) break;
            }

            // Cleanup and format
            let finalOutput = result.join(' ');
            return finalOutput.charAt(0).toUpperCase() + finalOutput.slice(1) + ".";
        },

        getStats: function() {
            return Object.keys(brain).length;
        }
    };
})();
