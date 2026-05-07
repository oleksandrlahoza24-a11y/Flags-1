const CustomAI = (function() {
    // 1. Memory Structure
    let brain = JSON.parse(localStorage.getItem('nexus_brain')) || {
        nodes: {}, // Every word is a node
        edges: [], // Links between words with weights
        mood: 0.5, // 0 (Bored) to 1 (Excited)
        vocabulary: []
    };

    // 2. Internal State (The "Life" part)
    let curiosity = 0.2;
    let focusWord = "";

    function save() {
        localStorage.setItem('nexus_brain', JSON.stringify(brain));
    }

    function tokenize(text) {
        return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    }

    // Connects two concepts in the brain
    function learn(w1, w2) {
        if (!brain.nodes[w1]) brain.nodes[w1] = { connections: {}, count: 1 };
        if (!brain.nodes[w1].connections[w2]) brain.nodes[w1].connections[w2] = 0;
        
        brain.nodes[w1].connections[w2]++;
        brain.nodes[w1].count++;
    }

    return {
        think: function(input) {
            const words = tokenize(input);
            
            // --- LEARNING PROCESS ---
            // Create "Semantic Chains" (Logic links)
            for (let i = 0; i < words.length; i++) {
                for (let j = i + 1; j < words.length; j++) {
                    learn(words[i], words[j]);
                    learn(words[j], words[i]);
                }
            }

            // Update Mood based on novelty
            let newWords = words.filter(w => !brain.nodes[w]);
            if (newWords.length > 0) {
                brain.mood = Math.min(1, brain.mood + 0.1); // Gets excited by new words
                curiosity = Math.min(1, curiosity + 0.2);
            } else {
                brain.mood = Math.max(0, brain.mood - 0.05); // Gets bored if it knows everything
            }

            // --- REASONING PROCESS ---
            // Find the "Focus" of the sentence
            focusWord = words.sort((a, b) => (brain.nodes[a]?.count || 0) - (brain.nodes[b]?.count || 0))[0];

            let associations = [];
            words.forEach(w => {
                if (brain.nodes[w]) {
                    Object.keys(brain.nodes[w].connections).forEach(related => {
                        associations.push({word: related, weight: brain.nodes[w].connections[related]});
                    });
                }
            });

            // Sort by strength and pick relevant ones
            associations.sort((a, b) => b.weight - a.weight);
            let conceptPool = [...new Set(associations.map(a => a.word))].slice(0, 5);

            save();

            // --- RESPONSE SYNTHESIS (The "Voice") ---
            if (conceptPool.length < 2) {
                return `I am processing "${words[0] || 'this'}". My understanding is limited. Explain it further?`;
            }

            // Decide voice based on curiosity and mood
            const r = Math.random();
            const conceptA = conceptPool[0];
            const conceptB = conceptPool[1];

            if (curiosity > 0.7) {
                curiosity -= 0.3;
                return `If ${conceptA} is linked to ${conceptB}, does that mean ${input.split(' ')[0]} is always relevant?`;
            }

            if (brain.mood > 0.6) {
                const templates = [
                    `I've noticed a strong pattern between ${conceptA} and ${conceptB}.`,
                    `My internal nodes are firing. ${conceptA} seems to define ${conceptB} in this context.`,
                    `Interesting. When you say ${words[0]}, I immediately visualize ${conceptA}.`
                ];
                return templates[Math.floor(Math.random() * templates.length)];
            }

            const stoicTemplates = [
                `${conceptA}. ${conceptB}. I am storing these associations.`,
                `Observation confirmed: ${conceptA} relates to ${conceptB}.`,
                `My database has grown. I now know ${Object.keys(brain.nodes).length} unique concepts.`
            ];
            return stoicTemplates[Math.floor(Math.random() * stoicTemplates.length)];
        },

        getStats: function() {
            return {
                mood: brain.mood > 0.7 ? "Excited" : brain.mood > 0.4 ? "Analytical" : "Idle",
                curiosity: curiosity,
                nodeCount: Object.keys(brain.nodes).length
            };
        }
    };
})();
