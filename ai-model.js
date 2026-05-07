const CustomAI = (function() {
    // Advanced Memory: Facts + Triggers
    let memory = JSON.parse(localStorage.getItem('nexus_v3_brain')) || {
        facts: {},       // Definitions (X is Y)
        triggers: {},    // Behaviors (When I say X, you do Y)
        vocabulary: []
    };

    function save() {
        localStorage.setItem('nexus_v3_brain', JSON.stringify(memory));
    }

    function clean(t) {
        return t.toLowerCase().replace(/[^\w\s']/g, '').trim();
    }

    return {
        process: function(input) {
            const raw = input;
            const text = clean(input);
            const words = text.split(/\s+/);

            // --- 1. COMMAND LEARNING (e.g., "Respond to 'Hi' with 'Hello friend!'") ---
            if (text.includes("respond to") && text.includes("with")) {
                try {
                    // Extract parts using regex or split
                    const triggerMatch = raw.match(/respond to ['"](.+?)['"]/i) || raw.match(/respond to (.+?) with/i);
                    const responseMatch = raw.match(/with ['"](.+?)['"]/i) || raw.match(/with (.+)/i);
                    
                    if (triggerMatch && responseMatch) {
                        const trigger = clean(triggerMatch[1]);
                        const response = responseMatch[1];
                        memory.triggers[trigger] = response;
                        save();
                        return `Protocol Updated. When you say "${trigger}", I will respond with "${response}".`;
                    }
                } catch(e) { return "I almost had that command, but the phrasing was tricky. Try: Respond to 'Hi' with 'Hello!'"; }
            }

            // --- 2. FACT LEARNING (e.g., "Fire is hot") ---
            if (words.includes("is") || words.includes("are")) {
                const isIndex = words.indexOf("is") !== -1 ? words.indexOf("is") : words.indexOf("are");
                const subject = words.slice(0, isIndex).join(' ');
                const trait = words.slice(isIndex + 1).join(' ');

                if (subject && trait && !text.includes("what is")) {
                    if (!memory.facts[subject]) memory.facts[subject] = [];
                    memory.facts[subject].push(trait);
                    save();
                    return `I have internalized that ${subject} is ${trait}.`;
                }
            }

            // --- 3. TRIGGER EXECUTION (Social Layer) ---
            // If the user said exactly a learned trigger (like "Hi")
            if (memory.triggers[text]) {
                return memory.triggers[text];
            }

            // --- 4. FACT RETRIEVAL ---
            for (let subject in memory.facts) {
                if (text.includes(subject)) {
                    const info = memory.facts[subject].join(' and ');
                    return `Based on our conversations, I know that ${subject} is ${info}.`;
                }
            }

            // --- 5. FALLBACK / CURIOSITY ---
            if (words.length > 0) {
                const unknown = words[words.length-1];
                const prompts = [
                    `I hear you, but I don't have a specific response for "${text}". Should I learn one?`,
                    `I'm still a blank slate regarding "${unknown}". Tell me more about it.`,
                    `Understood. But how should I respond to that in the future?`
                ];
                return prompts[Math.floor(Math.random() * prompts.length)];
            }
        },

        getComplexity: function() {
            return Object.keys(memory.triggers).length + Object.keys(memory.facts).length;
        }
    };
})();
