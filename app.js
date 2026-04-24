/* ============================================
   APP - shouldibreakup.lol
   Quiz engine + Claude API verdict.
   ============================================ */

(function () {
  "use strict";

  // -- State --
  var currentStep = 0;
  var answers = {};

  // -- DOM refs --
  var sectionIntro   = document.getElementById("sectionIntro");
  var sectionQuiz    = document.getElementById("sectionQuiz");
  var sectionLoading = document.getElementById("sectionLoading");
  var sectionResult  = document.getElementById("sectionResult");
  var quizSteps      = document.getElementById("quizSteps");
  var progressFill   = document.getElementById("progressFill");
  var stepLabel      = document.getElementById("stepLabel");
  var btnBack        = document.getElementById("btnBack");
  var btnNext        = document.getElementById("btnNext");
  var toast          = document.getElementById("toast");

  // -- Utility --
  function showSection(id) {
    [sectionIntro, sectionQuiz, sectionLoading, sectionResult].forEach(function (s) {
      if (s) s.classList.add("hidden");
    });
    var el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("visible");
    setTimeout(function () { toast.classList.remove("visible"); }, 3200);
  }

  // -- Build quiz steps into DOM --
  function buildQuiz() {
    if (!quizSteps) return;
    quizSteps.innerHTML = "";
    QUIZ_STEPS.forEach(function (step, i) {
      var div = document.createElement("div");
      div.className = "quiz-step hidden";
      div.id = "step-" + i;

      var title = document.createElement("h2");
      title.className = "step-title";
      title.textContent = step.title;

      var sub = document.createElement("p");
      sub.className = "step-subtitle";
      sub.textContent = step.subtitle;

      var grid = document.createElement("div");
      grid.className = "options-grid";

      step.options.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.className = "option-card";
        btn.dataset.optId = opt.id;
        btn.dataset.weight = opt.weight;
        btn.innerHTML =
          '<span class="opt-emoji">' + opt.emoji + '</span>' +
          '<span class="opt-label">' + opt.label + '</span>';

        btn.addEventListener("click", function () {
          toggleOption(step, i, opt.id, btn);
        });

        grid.appendChild(btn);
      });

      div.appendChild(title);
      div.appendChild(sub);
      div.appendChild(grid);
      quizSteps.appendChild(div);
    });
  }

  // -- Toggle option --
  function toggleOption(step, stepIndex, optId, btn) {
    if (!answers[step.id]) answers[step.id] = [];

    if (step.multi) {
      var idx = answers[step.id].indexOf(optId);
      if (idx === -1) {
        answers[step.id].push(optId);
        btn.classList.add("selected");
      } else {
        answers[step.id].splice(idx, 1);
        btn.classList.remove("selected");
      }
    } else {
      var grid = btn.closest(".options-grid");
      grid.querySelectorAll(".option-card").forEach(function (c) {
        c.classList.remove("selected");
      });
      answers[step.id] = [optId];
      btn.classList.add("selected");
    }

    validateStep(stepIndex);
  }

  // -- Validate step --
  function validateStep(stepIndex) {
    var step = QUIZ_STEPS[stepIndex];
    var hasAnswer = answers[step.id] && answers[step.id].length > 0;
    if (btnNext) btnNext.disabled = !hasAnswer;
  }

  // -- Show step --
  function showStep(index) {
    document.querySelectorAll(".quiz-step").forEach(function (el) {
      el.classList.add("hidden");
    });

    var stepEl = document.getElementById("step-" + index);
    if (!stepEl) return;
    stepEl.classList.remove("hidden");

    var step = QUIZ_STEPS[index];
    var stepAnswers = answers[step.id] || [];
    stepEl.querySelectorAll(".option-card").forEach(function (btn) {
      btn.classList.toggle("selected", stepAnswers.indexOf(btn.dataset.optId) !== -1);
    });

    var pct = Math.round((index / QUIZ_STEPS.length) * 100);
    if (progressFill) progressFill.style.width = pct + "%";
    if (stepLabel) stepLabel.textContent = "Step " + (index + 1) + " of " + QUIZ_STEPS.length;

    if (btnBack) btnBack.style.visibility = index === 0 ? "hidden" : "visible";

    var isLast = index === QUIZ_STEPS.length - 1;
    if (btnNext) {
      btnNext.textContent = isLast ? "get my answer ->" : "next ->";
      validateStep(index);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // -- Build prompt --
  function buildPrompt() {
    var lines = ["Here is someone's situation, described by selecting from a series of honest prompts:\n"];

    QUIZ_STEPS.forEach(function (step) {
      var selected = answers[step.id] || [];
      if (selected.length === 0) return;

      lines.push("## " + step.title);
      selected.forEach(function (optId) {
        var opt = step.options.find(function (o) { return o.id === optId; });
        if (opt) lines.push("- " + opt.label + " [signal: " + opt.weight + "]");
      });
      lines.push("");
    });

    lines.push("Based on all of the above, give your honest verdict.");
    return lines.join("\n");
  }

  // -- Claude API --
  function askClaude(prompt) {
    var systemPrompt = [
      "You are a brutally honest best friend - warm but unflinching. Someone has answered a series of questions about their relationship. Each answer is tagged with a signal: 'leave', 'stay', 'complicated', or 'neutral'.",
      "",
      "Your job: read the full picture, weigh the signals, and give a verdict of exactly one of these:",
      "LEAVE - they should end the relationship",
      "STAY - the relationship is worth continuing",
      "COMPLICATED - genuinely not clear-cut",
      "",
      "You MUST respond in valid JSON only. No markdown, no preamble. Exactly this structure:",
      "{",
      "  \"verdict\": \"LEAVE\" | \"STAY\" | \"COMPLICATED\",",
      "  \"reason\": \"One or two sentences. The core honest truth. Direct. No hedging.\",",
      "  \"detail\": \"Two or three short paragraphs. Specific to what they described. Name the patterns. Warm but honest.\",",
      "  \"closing\": \"One final sentence. Sharp. Memorable. The thing they'll screenshot.\"",
      "}",
      "",
      "Rules:",
      "- NEVER say 'only you can decide' or 'seek professional help' or 'communication is key'",
      "- If abuse or safety risk is described, always verdict LEAVE and be direct about why",
      "- Be kind but not soft. Honest but not cruel.",
      "- The closing should be something they'd want to send to a friend.",
      "- Use plain English, not therapy vocabulary"
    ].join("\n");

    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
      })
    })
    .then(function (r) {
      if (!r.ok) throw new Error("API error: " + r.status);
      return r.json();
    })
    .then(function (data) {
      var text = "";
      (data.content || []).forEach(function (block) {
        if (block.type === "text") text += block.text;
      });
      var clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    });
  }

  // -- Render result --
  function renderResult(result) {
    var verdict = (result.verdict || "COMPLICATED").toUpperCase();
    var reason  = result.reason  || "";
    var detail  = result.detail  || "";
    var closing = result.closing || "";

    var cls   = verdict === "LEAVE" ? "verdict-leave" : verdict === "STAY" ? "verdict-stay" : "verdict-complicated";
    var color = verdict === "LEAVE" ? "var(--accent-leave)" : verdict === "STAY" ? "var(--accent-stay)" : "var(--accent-complicated)";
    var lines = verdict === "COMPLICATED" ? ["IT'S", "COMPLI-", "CATED."] : verdict === "LEAVE" ? ["LEAVE."] : ["STAY."];

    var verdictEl = document.getElementById("verdictBlock");
    if (verdictEl) {
      verdictEl.className = "verdict-block " + cls;
      verdictEl.innerHTML = lines.map(function (l) { return "<span>" + l + "</span>"; }).join("");
    }

    var card = document.getElementById("shareCard");
    if (card) card.style.setProperty("--verdict-color", color);

    var reasonEl = document.getElementById("verdictReason");
    if (reasonEl) reasonEl.textContent = reason;

    var detailEl = document.getElementById("verdictDetail");
    if (detailEl) {
      var paras = detail.split(/\n\n|\n/).filter(function (p) { return p.trim(); });
      detailEl.innerHTML = paras.map(function (p) { return "<p>" + p + "</p>"; }).join("");
    }

    var closingEl = document.getElementById("verdictClosing");
    if (closingEl) closingEl.textContent = closing;

    wireShareButtons(verdict, closing);
    showSection("sectionResult");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // -- Render error --
  function renderError() {
    var verdictEl = document.getElementById("verdictBlock");
    if (verdictEl) verdictEl.innerHTML = '<span class="error-state">something went wrong.</span>';

    var reasonEl = document.getElementById("verdictReason");
    if (reasonEl) reasonEl.textContent = "";

    var detailEl = document.getElementById("verdictDetail");
    if (detailEl) detailEl.innerHTML = '<p class="error-sub">couldn\'t get an answer. check your connection and try again.</p>';

    var closingEl = document.getElementById("verdictClosing");
    if (closingEl) closingEl.textContent = "";

    showSection("sectionResult");
  }

  // -- Loading animation --
  function startLoadingAnimation() {
    var pair = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    var l1 = document.getElementById("loadingLine1");
    var l2 = document.getElementById("loadingLine2");
    if (l1) l1.textContent = pair[0];
    if (l2) {
      l2.textContent = "";
      setTimeout(function () { if (l2) l2.textContent = pair[1]; }, 900);
    }
  }

  // -- Submit quiz --
  function submitQuiz() {
    var prompt = buildPrompt();
    showSection("sectionLoading");
    startLoadingAnimation();
    window.scrollTo({ top: 0, behavior: "smooth" });

    askClaude(prompt)
      .then(renderResult)
      .catch(function (err) {
        console.error("Claude API error:", err);
        renderError();
      });
  }

  // -- Share buttons --
  function wireShareButtons(verdict, closing) {
    var emoji = verdict === "LEAVE" ? "🚩" : verdict === "STAY" ? "💚" : "🤔";
    var shareText =
      emoji + " i just took the should i break up quiz.\n\n" +
      "verdict: " + verdict + "\n\n" +
      '"' + closing + '"\n\n' +
      "shouldibreakup.lol";

    var wa = document.getElementById("btnWhatsapp");
    var tw = document.getElementById("btnTwitter");
    var im = document.getElementById("btnImage");

    if (wa) wa.onclick = function () {
      window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
    };
    if (tw) tw.onclick = function () {
      window.open("https://x.com/intent/tweet?text=" + encodeURIComponent(shareText), "_blank");
    };
    if (im) im.onclick = saveAsImage;
  }

  // -- Save as image --
  function saveAsImage() {
    var card = document.getElementById("shareCard");
    if (!card) { showToast("nothing to save yet."); return; }
    if (typeof html2canvas === "undefined") { showToast("image export loading - try in a moment."); return; }
    showToast("generating image...");
    html2canvas(card, { backgroundColor: null, scale: 2, useCORS: true, logging: false })
      .then(function (canvas) {
        var link = document.createElement("a");
        link.download = "shouldibreakup-" + Date.now() + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast("saved. go send it.");
      })
      .catch(function () { showToast("couldn't generate - try screenshotting instead."); });
  }

  // -- Init --
  function init() {
    // Footer year
    var fy = document.getElementById("footerYear");
    if (fy) fy.textContent = new Date().getFullYear();

    // Theme
    var html = document.documentElement;
    var saved = localStorage.getItem("sib_theme") || "dark";
    html.setAttribute("data-theme", saved);

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.onclick = function () {
        var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
        html.setAttribute("data-theme", next);
        localStorage.setItem("sib_theme", next);
      };
    }

    // Build quiz
    buildQuiz();

    // Start button
    var startBtn = document.getElementById("startBtn");
    if (startBtn) {
      startBtn.onclick = function () {
        currentStep = 0;
        answers = {};
        showSection("sectionQuiz");
        showStep(0);
      };
    }

    // Next button
    if (btnNext) {
      btnNext.onclick = function () {
        var isLast = currentStep === QUIZ_STEPS.length - 1;
        if (isLast) {
          submitQuiz();
        } else {
          currentStep++;
          showStep(currentStep);
        }
      };
    }

    // Back button
    if (btnBack) {
      btnBack.onclick = function () {
        if (currentStep > 0) {
          currentStep--;
          showStep(currentStep);
        }
      };
    }

    // Again button
    var againBtn = document.getElementById("btnAgain");
    if (againBtn) {
      againBtn.onclick = function () {
        currentStep = 0;
        answers = {};
        showSection("sectionIntro");
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    }

    // Ad close
    var adClose = document.getElementById("adClose");
    if (adClose) {
      adClose.onclick = function () {
        var sticky = document.getElementById("adSticky");
        if (sticky) sticky.remove();
        document.body.style.paddingBottom = "0";
      };
    }
  }

  init();

})();
