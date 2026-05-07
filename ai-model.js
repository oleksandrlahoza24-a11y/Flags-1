const NexusAI = (function () {
  // ── Memory ────────────────────────────────────────────────────────────────
  let brain = (() => {
    try { return JSON.parse(localStorage.getItem('nexus_v4')) || {}; }
    catch (e) { return {}; }
  })();
  if (!brain.facts)               brain.facts = {};
  if (!brain.triggers)            brain.triggers = {};
  if (!brain.context)             brain.context = {};
  if (!brain.conversationHistory) brain.conversationHistory = [];

  function save() {
    try { localStorage.setItem('nexus_v4', JSON.stringify(brain)); }
    catch (e) { console.warn('NexusAI: could not save to localStorage', e); }
  }

  // ── Text utilities ────────────────────────────────────────────────────────
  function clean(t) {
    return t.toLowerCase().replace(/[^\w\s']/g, '').trim();
  }

  function tokenize(t) {
    return clean(t).split(/\s+/).filter(Boolean);
  }

  // Jaccard similarity – used for fuzzy trigger + fact matching
  function similarity(a, b) {
    const setA = new Set(tokenize(a));
    const setB = new Set(tokenize(b));
    const inter = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union ? inter / union : 0;
  }

  // ── Trigger matching ──────────────────────────────────────────────────────
  function findBestTrigger(text) {
    const cleaned = clean(text);
    let best = null, bestScore = 0;
    for (const trigger in brain.triggers) {
      if (cleaned === trigger) return { trigger, response: brain.triggers[trigger], score: 1 };
      const score = similarity(cleaned, trigger);
      if (score > 0.6 && score > bestScore) {
        best = trigger;
        bestScore = score;
      }
    }
    return best ? { trigger: best, response: brain.triggers[best], score: bestScore } : null;
  }

  // ── Fact retrieval ────────────────────────────────────────────────────────
  function findRelevantFacts(text) {
    const cleaned = clean(text);
    const results = [];

    for (const subject in brain.facts) {
      if (cleaned.includes(subject)) {
        results.push({ subject, info: brain.facts[subject], relevance: 1 });
      } else {
        const score = similarity(cleaned, subject);
        if (score > 0.4) results.push({ subject, info: brain.facts[subject], relevance: score });
      }
    }

    for (const key in brain.context) {
      const score = similarity(cleaned, key);
      if (score > 0.3) {
        results.push({ subject: key, info: [brain.context[key]], relevance: score * 0.8 });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
  }

  // ── Learning ──────────────────────────────────────────────────────────────
  function learnFact(subject, predicate, value) {
    if (!brain.facts[subject]) brain.facts[subject] = [];
    const duplicate = brain.facts[subject].find(f => similarity(f, value) > 0.8);
    if (!duplicate) brain.facts[subject].push(value);
    save();
  }

  function learnContext(key, value) {
    brain.context[key] = value;
    save();
  }

  /**
   * Parse the user's input for any learning intent.
   * Returns an intent object or null if nothing was learned.
   */
  function parseLearnIntent(text, raw) {
    // 1. Custom trigger/response  e.g. "When I say 'hi', say 'Hello friend!'"
    const triggerMatch =
      raw.match(/(?:respond to|when I say|if I say|whenever I say)\s+['"](.+?)['"]/i) ||
      raw.match(/(?:respond to|when I say|if I say)\s+(.+?)\s+(?:with|by saying)/i);
    const replyMatch =
      raw.match(/(?:with|by saying|say)\s+['"](.+?)['"]/i) ||
      raw.match(/(?:with|by saying)\s+(.+)/i);

    if (triggerMatch && replyMatch) {
      const trigger = clean(triggerMatch[1]);
      const response = replyMatch[1].replace(/['"]/g, '').trim();
      brain.triggers[trigger] = response;
      save();
      return { type: 'trigger', trigger, response };
    }

    // 2. Name  e.g. "My name is Alex" / "Call me Alex"
    const nameMatch = raw.match(/(?:my name is|i'm called|call me|i am)\s+([A-Za-z]+)/i);
    if (nameMatch) {
      const name = nameMatch[1];
      learnContext('user_name', name);
      learnFact('user', 'name', name);
      return { type: 'name', name };
    }

    // 3. Simple "X is Y" or "X are Y" facts
    const words = tokenize(text);
    const isIdx = words.indexOf('is') !== -1 ? words.indexOf('is') : words.indexOf('are');
    if (
      isIdx > 0 &&
      isIdx < words.length - 1 &&
      !/what (is|are)|who (is|are)/.test(text)
    ) {
      const subject = words.slice(0, isIdx).join(' ');
      const trait   = words.slice(isIdx + 1).join(' ');
      if (subject && trait) {
        learnFact(subject, 'is', trait);
        return { type: 'fact', subject, trait };
      }
    }

    // 4. Preferences  e.g. "I love coffee" / "I hate Mondays"
    const likeMatch = raw.match(/i (love|like|enjoy|hate|dislike|prefer)\s+(.+)/i);
    if (likeMatch) {
      const sentiment = likeMatch[1].toLowerCase();
      const thing     = clean(likeMatch[2]);
      learnFact('user_preferences', sentiment, thing);
      return { type: 'preference', sentiment, thing };
    }

    return null;
  }

  // ── Response generation ───────────────────────────────────────────────────
  function buildResponse(intent, text, raw) {
    const name  = brain.context['user_name'];
    const greet = name ? ` ${name}` : '';

    // Learned something new – confirm it
    if (intent) {
      if (intent.type === 'trigger') {
        return `Got it${greet}. Whenever you say "${intent.trigger}", I'll respond with "${intent.response}".`;
      }
      if (intent.type === 'name') {
        return `Nice to meet you, ${intent.name}! I'll remember your name. You can teach me facts, set up custom responses, or just chat.`;
      }
      if (intent.type === 'fact') {
        return pickRandom([
          `Noted${greet} — I've learned that ${intent.subject} is ${intent.trait}.`,
          `I'll remember that${greet}: ${intent.subject} is ${intent.trait}.`,
          `Got it${greet}. ${cap(intent.subject)} is ${intent.trait} — filed away.`,
        ]);
      }
      if (intent.type === 'preference') {
        return `I've noted that you ${intent.sentiment} ${intent.thing}${greet}. I'll keep that in mind.`;
      }
    }

    // Fuzzy trigger match
    const trig = findBestTrigger(text);
    if (trig) return trig.response;

    // Relevant facts
    const facts = findRelevantFacts(text);
    if (facts.length > 0) {
      const top  = facts[0];
      const info = top.info.join(' and ');
      if (top.relevance >= 0.9) return `Based on what you've told me, ${top.subject} is ${info}.`;
      if (top.relevance >= 0.5) return `That might relate to what I know: ${top.subject} is ${info}. Is that what you meant?`;
    }

    // Built-in Q&A
    if (/what(?:'s| is) your name|who are you/i.test(raw)) {
      return `I'm Nexus — your personal AI. You teach me, I remember.`;
    }
    if (/what do you know(?! about)/i.test(raw) || /what have i taught you/i.test(raw)) {
      return buildMemorySummary();
    }
    const topicMatch = raw.match(/what do you know about (.+)/i);
    if (topicMatch) return buildTopicSummary(topicMatch[1]);

    if (/forget everything|clear memory|reset/i.test(raw)) {
      brain.facts = {}; brain.triggers = {}; brain.context = {}; brain.conversationHistory = [];
      save();
      return `Memory cleared. I'm a blank slate again${greet}. What would you like to teach me?`;
    }
    if (/how many facts|how much do you know/i.test(raw)) {
      const fc = Object.keys(brain.facts).length;
      const tc = Object.keys(brain.triggers).length;
      return `I know ${fc} fact${fc !== 1 ? 's' : ''} and have ${tc} custom response${tc !== 1 ? 's' : ''} set up.`;
    }
    if (/^(hi|hello|hey|howdy|hiya|yo)[\s!.?]*$/i.test(raw.trim())) {
      return pickRandom([
        `Hey${greet}! What's on your mind?`,
        `Hello${greet}! Ready to learn or chat.`,
        `Hi there${greet}! Tell me something new, or ask me what I know.`,
      ]);
    }
    if (/thank(?:s| you)/i.test(raw)) {
      return pickRandom([`Happy to help${greet}!`, `Of course${greet}.`, `Anytime!`]);
    }

    // Fallback – invite teaching
    return buildCuriousResponse(text, name);
  }

  function buildMemorySummary() {
    const factKeys = Object.keys(brain.facts);
    const trigKeys = Object.keys(brain.triggers);
    if (!factKeys.length && !trigKeys.length) {
      return "You haven't taught me anything yet. Try \"Coffee is energising\" or \"My name is Alex\".";
    }
    const parts = [];
    if (brain.context['user_name']) parts.push(`Your name is ${brain.context['user_name']}`);
    if (factKeys.length) {
      parts.push(`${factKeys.length} fact${factKeys.length > 1 ? 's' : ''} about: ${factKeys.slice(0, 4).join(', ')}${factKeys.length > 4 ? '…' : ''}`);
    }
    if (trigKeys.length) {
      parts.push(`${trigKeys.length} custom response${trigKeys.length > 1 ? 's' : ''} (e.g. "${trigKeys[0]}")`);
    }
    return `Here's what I know: ${parts.join('. ')}.`;
  }

  function buildTopicSummary(topic) {
    const cleaned = clean(topic);
    const found = [];
    for (const subject in brain.facts) {
      if (subject.includes(cleaned) || cleaned.includes(subject) || similarity(subject, cleaned) > 0.4) {
        found.push(`${subject} is ${brain.facts[subject].join(' and ')}`);
      }
    }
    if (!found.length) return `I don't know anything about "${topic.trim()}" yet. Want to tell me?`;
    return `About ${topic.trim()}: ${found.join('; ')}.`;
  }

  function buildCuriousResponse(text, name) {
    const greet = name ? ` ${name}` : '';
    const words  = tokenize(text);
    return pickRandom([
      `I don't have a specific response to that yet${greet}. You can teach me by saying "When I say this, respond with…"`,
      `That's new territory for me${greet}. Want to teach me how to respond to that?`,
      `I picked up on "${words.slice(-2).join(' ')}" but I'm not sure what you're after. Give me a hint?`,
      `I'm curious${greet} — tell me more, or teach me a response with: "Respond to '…' with '…'"`,
    ]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  function addToHistory(role, content) {
    brain.conversationHistory.push({ role, content, ts: Date.now() });
    if (brain.conversationHistory.length > 40) {
      brain.conversationHistory = brain.conversationHistory.slice(-40);
    }
    save();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    process(input) {
      const raw    = input.trim();
      const text   = clean(raw);
      addToHistory('user', raw);
      const intent = parseLearnIntent(text, raw);
      const reply  = buildResponse(intent, text, raw);
      addToHistory('ai', reply);
      return reply;
    },

    getStats() {
      return {
        facts:    Object.keys(brain.facts).length,
        triggers: Object.keys(brain.triggers).length,
        turns:    brain.conversationHistory.length,
      };
    },

    /** Export full brain as a JSON string for backup */
    exportMemory() { return JSON.stringify(brain, null, 2); },

    /** Import a previously exported brain JSON string */
    importMemory(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        brain = data;
        save();
        return true;
      } catch (e) { return false; }
    },
  };
})();
