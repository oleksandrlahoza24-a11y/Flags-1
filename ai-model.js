const CustomAI = (function() {
    // Persistent Knowledge Map
    let memory = JSON.parse(localStorage.getItem('smart_brain')) || {
        concepts: {}, // Stores: { "fire": ["hot", "dangerous"] }
        history: []   // Remembers the last few topics
    };

    // Words to ignore for "Thinking" (Stop Words)
    const noise = ["the", "is", "a", "an", "are", "of", "to", "it", "this", "that", "do", "you", "what", "how"];

    function save() {
        localStorage.setItem('smart_brain', JSON.stringify(memory));
    }

    function clean(text) {
        return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    }

    return {
        process: function(input) {
            const words = clean(input);
            const coreConcepts = words.filter(w => !noise.includes(w));
            
            // --- LOGIC 1: LEARNING (Example: "Fire is hot") ---
            if (words.includes("is") || words.includes("are")) {
                let subject = coreConcepts[0];
                let trait = coreConcepts.slice(1).join(' ');

                if (subject && trait) {
                    if (!memory.concepts[subject]) memory.concepts[subject] = [];
                    if (!memory.concepts[subject].includes(trait)) {
                        memory.concepts[subject].push(trait);
                    }
                    save();
                    memory.history.push(subject);
                    return `Understood. I have linked [${subject}] with the property: ${trait}.`;
                }
            }

            // --- LOGIC 2: RETRIEVAL (Example: "What do you know about fire?") ---
            // Look for known subjects in the user's question
            let foundSubject = coreConcepts.find(w => memory.concepts[w]);
            
            // If the user didn't name a subject, maybe they are using "it" (context)
            if (!foundSubject && (words.includes("it") || words.includes("this"))) {
                foundSubject = memory.history[memory.history.length - 1];
            }

            if (foundSubject) {
                const traits = memory.concepts[foundSubject];
                const responseMap = [
                    `My data shows ${foundSubject} is characterized by ${traits.join(' and ')}.`,
                    `Based on what I've learned, ${foundSubject} is ${traits[Math.floor(Math.random()*traits.length)]}.`,
                    `Regarding ${foundSubject}: it is ${traits.join(', ')}.`
                ];
                memory.history.push(foundSubject);
                return responseMap[Math.floor(Math.random() * responseMap.length)];
            }

            // --- LOGIC 3: CURIOSITY (If it doesn't know) ---
            if (coreConcepts.length > 0) {
                const unknown = coreConcepts[0];
                return `I am unfamiliar with "${unknown}". Is it a concept I should define? Tell me: "${unknown} is..."`;
            }

            return "My neural network is active, but I require more specific logical input.";
        },

        getK: function() {
            return Object.keys(memory.concepts).length;
        }
    };
})();
