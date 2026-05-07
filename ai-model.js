const CustomAI = (function() {
    // Load brain from localStorage or start empty
    let memory = JSON.parse(localStorage.getItem('ai_brain')) || {
        relationships: {}, // How words relate to each other
        lastInput: ""      // To learn cause-and-effect
    };

    function save() {
        localStorage.setItem('ai_brain', JSON.stringify(memory));
    }

    function tokenize(text) {
        return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    }

    return {
        think: function(input) {
            const words = tokenize(input);
            
            // 1. LEARNING PHASE
            // Link words in the current sentence to each other
            words.forEach(word => {
                if (!memory.relationships[word]) memory.relationships[word] = [];
                words.forEach(related => {
                    if (word !== related) {
                        memory.relationships[word].push(related);
                    }
                });
            });

            // Link the last thing said to the current thing (sequence learning)
            if (memory.lastInput) {
                const prevWords = tokenize(memory.lastInput);
                prevWords.forEach(prev => {
                    if (!memory.relationships[prev]) memory.relationships[prev] = [];
                    memory.relationships[prev].push(...words);
                });
            }

            // 2. RESPONSE GENERATION PHASE
            let possibleResponses = [];
            
            words.forEach(word => {
                if (memory.relationships[word]) {
                    possibleResponses.push(...memory.relationships[word]);
                }
            });

            // Store current input for next learning cycle
            memory.lastInput = input;
            save();

            if (possibleResponses.length === 0) {
                return "I don't know enough about those words yet. Tell me more.";
            }

            // 3. SYNTHESIS
            // Pick the most relevant associated words
            const uniqueResponses = [...new Set(possibleResponses)];
            const shuffle = uniqueResponses.sort(() => 0.5 - Math.random());
            const selection = shuffle.slice(0, 4); // Pick top 4 related concepts

            // Construct a "sentence"
            const connectors = ["is related to", "makes me think of", "and", "usually involves"];
            const conn = connectors[Math.floor(Math.random() * connectors.length)];
            
            return `Talking about "${words[0]}" ${conn} ${selection.join(', ')}.`;
        },

        getMemorySize: function() {
            return Object.keys(memory.relationships).length;
        },

        forget: function() {
            localStorage.removeItem('ai_brain');
            location.reload();
        }
    };
})();
