/* ============================================
   DATA — shouldibreakup.com
   Quiz steps, questions, weights.
   ============================================ */

/*
  Each step has:
    id         — unique key
    title      — displayed at top of step
    subtitle   — small hint text
    multi      — true = select multiple; false = pick one
    options    — array of { id, label, emoji, weight }

  Weight system (used to build the AI prompt summary):
    weight: "leave"       — signals this relationship should probably end
    weight: "stay"        — signals worth continuing
    weight: "complicated" — genuinely nuanced
    weight: "neutral"     — context, not a signal
*/

var QUIZ_STEPS = [

  // ── STEP 1: The vibe ──────────────────────────────
  {
    id: "vibe",
    title: "When you think about them right now…",
    subtitle: "Be honest. Pick the one that hits closest.",
    multi: false,
    options: [
      { id: "v_warm",   label: "I feel warmth. I love this person.",              emoji: "🥰", weight: "stay" },
      { id: "v_tired",  label: "I feel exhausted. Constantly.",                   emoji: "😮‍💨", weight: "leave" },
      { id: "v_numb",   label: "I feel nothing. That's what scares me.",          emoji: "😶", weight: "leave" },
      { id: "v_angry",  label: "I feel resentful. A lot.",                        emoji: "😤", weight: "leave" },
      { id: "v_scared", label: "I feel scared — of them, or of leaving.",         emoji: "😨", weight: "complicated" },
      { id: "v_stuck",  label: "I feel trapped. Not bad, just… stuck.",           emoji: "🪤", weight: "complicated" },
      { id: "v_confused","label": "I genuinely don't know what I feel.",          emoji: "🌀", weight: "complicated" },
      { id: "v_fond",   label: "I love them but I'm not in love with them.",      emoji: "🫂", weight: "complicated" },
    ]
  },

  // ── STEP 2: The fighting ──────────────────────────
  {
    id: "conflict",
    title: "How do you handle conflict?",
    subtitle: "Select all that apply.",
    multi: true,
    options: [
      { id: "c_same",    label: "We have the same fight on repeat. Nothing resolves.", emoji: "🔁", weight: "leave" },
      { id: "c_repair",  label: "We fight but we genuinely repair afterwards.",        emoji: "🩹", weight: "stay" },
      { id: "c_silent",  label: "One or both of us goes silent for days.",             emoji: "🔇", weight: "leave" },
      { id: "c_scared",  label: "I feel scared or unsafe during arguments.",           emoji: "🚨", weight: "leave" },
      { id: "c_avoids",  label: "We avoid conflict entirely — nothing gets addressed.",emoji: "🙈", weight: "complicated" },
      { id: "c_rare",    label: "We rarely fight. When we do, it's manageable.",       emoji: "☁️", weight: "stay" },
      { id: "c_screaming","label":"It escalates. Shouting, name-calling.",             emoji: "🌋", weight: "leave" },
      { id: "c_myfault", label: "I'm always made to feel like it's my fault.",         emoji: "👈", weight: "leave" },
    ]
  },

  // ── STEP 3: Day to day ────────────────────────────
  {
    id: "daily",
    title: "In day-to-day life…",
    subtitle: "Select everything that rings true.",
    multi: true,
    options: [
      { id: "d_dread",   label: "I dread going home to them.",                        emoji: "🚪", weight: "leave" },
      { id: "d_happy",   label: "Being around them generally makes me happy.",        emoji: "☀️", weight: "stay" },
      { id: "d_alone",   label: "I feel more alone with them than I would without.",  emoji: "🏝️", weight: "leave" },
      { id: "d_laugh",   label: "We still laugh. Like, genuinely.",                   emoji: "😂", weight: "stay" },
      { id: "d_walk",    label: "I'm walking on eggshells constantly.",               emoji: "🥚", weight: "leave" },
      { id: "d_friends", label: "They isolate me from friends or family.",            emoji: "🔒", weight: "leave" },
      { id: "d_boring",  label: "We're fine. Just... boring. No spark.",              emoji: "💤", weight: "complicated" },
      { id: "d_support", label: "They're genuinely my biggest supporter.",            emoji: "🫶", weight: "stay" },
    ]
  },

  // ── STEP 4: Trust ─────────────────────────────────
  {
    id: "trust",
    title: "Trust and honesty.",
    subtitle: "Select all that apply.",
    multi: true,
    options: [
      { id: "t_check",    label: "I check their phone. I can't stop.",                emoji: "📱", weight: "leave" },
      { id: "t_solid",    label: "I trust them completely. Zero doubts.",             emoji: "🔐", weight: "stay" },
      { id: "t_cheated",  label: "They cheated. I said I forgave them.",              emoji: "💔", weight: "leave" },
      { id: "t_icheated", label: "I cheated. Or thought seriously about it.",         emoji: "👀", weight: "complicated" },
      { id: "t_lies",     label: "I've caught them in lies, small or large.",         emoji: "🤥", weight: "leave" },
      { id: "t_gut",      label: "Something feels off. I can't prove it.",            emoji: "🌡️", weight: "complicated" },
      { id: "t_open",     label: "We're honest with each other. Even the hard stuff.",emoji: "📖", weight: "stay" },
      { id: "t_past",     label: "Old trust issues — not recent ones.",               emoji: "🗄️", weight: "complicated" },
    ]
  },

  // ── STEP 5: The honest check-in ───────────────────
  {
    id: "honest",
    title: "Be ruthlessly honest with yourself.",
    subtitle: "Select everything you actually believe.",
    multi: true,
    options: [
      { id: "h_better",   label: "I imagine my life being better without them.",     emoji: "🌅", weight: "leave" },
      { id: "h_scared",   label: "I'm staying because I'm scared of being alone.",  emoji: "🫣", weight: "leave" },
      { id: "h_history",  label: "I'm staying because of how long we've been together.", emoji: "⌛", weight: "leave" },
      { id: "h_want",     label: "I genuinely want to be with them. Not need. Want.",emoji: "❤️", weight: "stay" },
      { id: "h_change",   label: "I'm waiting for them to change. They haven't.",   emoji: "⏳", weight: "leave" },
      { id: "h_grow",     label: "I've grown as a person because of this relationship.", emoji: "🌱", weight: "stay" },
      { id: "h_drain",    label: "This relationship is draining me.",                emoji: "🪫", weight: "leave" },
      { id: "h_ready",    label: "I know what I should do. I'm just not ready.",    emoji: "🚦", weight: "complicated" },
    ]
  },

  // ── STEP 6: The context ───────────────────────────
  {
    id: "context",
    title: "Any of these apply?",
    subtitle: "Context matters. Select anything relevant.",
    multi: true,
    options: [
      { id: "ctx_ld",      label: "Long distance with no clear end date.",           emoji: "✈️", weight: "complicated" },
      { id: "ctx_kids",    label: "Kids or serious financial entanglement.",         emoji: "👶", weight: "complicated" },
      { id: "ctx_mh",      label: "Mental health issues are a significant factor.",  emoji: "🧠", weight: "complicated" },
      { id: "ctx_patch",   label: "It's genuinely just a rough patch. Clear cause.", emoji: "🩺", weight: "stay" },
      { id: "ctx_abuse",   label: "There is emotional or physical abuse happening.", emoji: "🆘", weight: "leave" },
      { id: "ctx_timing",  label: "Wrong time, not wrong person.",                   emoji: "🕰️", weight: "complicated" },
      { id: "ctx_effort",  label: "Only one of us is putting in effort.",            emoji: "⚖️", weight: "leave" },
      { id: "ctx_none",    label: "None of these — just a standard relationship.",  emoji: "📋", weight: "neutral" },
    ]
  },

];

/* ── Loading messages ── */
var LOADING_MESSAGES = [
  ["Reading between the lines…",        "And the red ones."],
  ["Thinking like your most honest friend…", "The one who actually tells you."],
  ["Weighing it up…",                   "This deserves a real answer."],
  ["Not sugarcoating this…",            "You didn't ask for comfort."],
  ["Consulting the brutal truth department…", "Won't be a moment."],
];
