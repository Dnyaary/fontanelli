    /**
     * aqui é onde o bicho pega e a mae ver
     */
    const STATE = {
      runId: 0, 
      currentScreen: null,
      choice: null,
      isTransitioning: false,
      currentVideoSrc: "assets/bg-default.mp4",
      secret: false,
      ux: null,
      holdTimer: null,
      pendingTimers: []
    };

    const CHOICES = [
      { id: "voz", label: "A voz", title: "Sua voz.", badge: "VOZ", lines: ["Disseram que você exagera.", "Quando falou pouco. Quando falou demais.\nQuando falou certo.", "Sua voz ecoa."] },
      { id: "tempo", label: "O tempo", title: "Seu tempo.", badge: "TEMPO", lines: ["Seu tempo virou disponibilidade.", "Quando era urgente pros outros.\nQuando era seu, não contava.", "Seu tempo é seu."] },
      { id: "corpo", label: "O corpo", title: "Seu corpo.", badge: "CORPO", lines: ["Opinaram. Julgaram. Tomaram liberdade.", "Como se fosse espaço público.\nComo se não tivesse dona.", "Seu corpo é seu."] },
      { id: "sanidade", label: "A sanidade", title: "Sua sanidade.", badge: "MENTE", lines: ["Chamaram de drama.", "Porque você não fingiu que estava bem.\nPorque sentir era inconveniente.", "Sua mente te pertence."] }
    ];

    // --- text finais ---
    const ENDINGS = {
      "voz": {
        s5_1: "Não é sobre falar bonito.",
        s5_2: "É sobre falar mesmo quando tentam te calar.",
        s6_1: "Não pra te dar parabéns.",
        s6_2: "Pra lembrar que a sua voz não é favor.\nE que segurar isso custa.",
        word: "Presente."
      },
      "tempo": {
        s5_1: "Não é sobre dar conta de tudo.",
        s5_2: "É sobre alguém parar de tomar o seu tempo como se fosse infinito.",
        s6_1: "Não pra te dar parabéns.",
        s6_2: "Pra lembrar que seu tempo é seu.\nE que existir assim custa.",
        word: "Ainda aqui."
      },
      "corpo": {
        s5_1: "Não é sobre opinião.",
        s5_2: "É sobre limite. Sobre respeito. Sobre ser sua.",
        s6_1: "Não pra te dar parabéns.",
        s6_2: "Pra lembrar que seu corpo não é debate.\nE que existir assim custa.",
        word: "Inteira."
      },
      "sanidade": {
        s5_1: "Não é sobre ser forte o tempo todo.",
        s5_2: "É sobre não desabar quando ninguém vê — e ainda continuar.",
        s6_1: "Não pra te dar parabéns.",
        s6_2: "Pra lembrar que você não precisa provar nada.\nE que existir assim custa.",
        word: "Permanece."
      }
    };

    // --- meu game designer secreto ---
    const SECRET_ENDING = {
      s7_1: "Hoje ninguém precisa te convencer de nada.",
      s7_2: "Você já sabe."
    };

    // --- UX profiles ---
    const UX_PROFILE = {
      voz: {
        typeSpeed: 25,
        pauseShort: 100,
        pauseLong: 300,
        silenceDuration: 1200
      },
      tempo: {
        typeSpeed: 35,
        pauseShort: 200,
        pauseLong: 500,
        silenceDuration: 1800
      },
      corpo: {
        typeSpeed: 30,
        pauseShort: 150,
        pauseLong: 400,
        silenceDuration: 1500
      },
      sanidade: {
        typeSpeed: 40,
        pauseShort: 250,
        pauseLong: 600,
        silenceDuration: 2000
      },
      default: {
        typeSpeed: 30,
        pauseShort: 100,
        pauseLong: 300,
        silenceDuration: 1200
      }
    };

    // --- location dos videos ---
    const VIDEO_MAP = {
      "voz": "assets/voz.mp4",
      "tempo": "assets/tempo.mp4",
      "corpo": "assets/corpo.mp4",
      "sanidade": "assets/sanidade.mp4",
      "default": "assets/bg-default.mp4"
    };

    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const checkState = (id) => { if (id !== STATE.runId) throw new Error("SESSION_ABORTED"); };

    // --- motor de video ---
    function preloadVideos() {
      Object.values(VIDEO_MAP).forEach(src => {
        const v = document.createElement('video');
        v.preload = 'auto';
        v.src = src;
      });
    }

    async function setBackgroundVideo(routeId, expectedRunId) {
      const activeVid = document.querySelector('.bg-video-wrap video.active');
      const inactiveVid = document.querySelector('.bg-video-wrap video.inactive');
      const targetSrc = VIDEO_MAP[routeId] || VIDEO_MAP["default"];

      // se o video já tiver ativado, num é pra fazer nada
      if (STATE.currentVideoSrc === targetSrc) {
        console.log("✅ Vídeo já está ativo:", targetSrc);
        return;
      }

      console.log("⚙️ Carregando vídeo:", targetSrc);

      // carregar um novo video inativo 
      inactiveVid.src = targetSrc;
      inactiveVid.load(); 

      // wait do video
      const isReady = await new Promise(resolve => {
        const timeout = setTimeout(() => {
          console.warn("⚠️ Timeout no carregamento, forçando troca mesmo assim");
          resolve(false); 
        }, 2000);

        const onReady = () => {
          console.log("✅ Vídeo pronto:", targetSrc);
          clearTimeout(timeout);
          resolve(true);
        };

        inactiveVid.addEventListener('loadeddata', onReady, { once: true });
      });

      // verificar se ainda tá executando
      if (STATE.runId !== expectedRunId) {
        console.log("❌ Execução foi cancelada");
        return;
      }

      // safe troca
      activeVid.style.transition = "opacity 1.5s ease-in-out";
      inactiveVid.style.transition = "opacity 1.5s ease-in-out";

      // play no new video
      try {
        await inactiveVid.play();
      } catch (e) {
        console.error("❌ Erro ao dar play:", e);
      }

      // trocar as classes <|>
      activeVid.classList.remove('active');
      activeVid.classList.add('inactive');
      
      inactiveVid.classList.remove('inactive');
      inactiveVid.classList.add('active');

      // updade de states
      STATE.currentVideoSrc = targetSrc;

      console.log("✅ Vídeo trocado com sucesso para:", targetSrc);

      // apagar o video antigo e armazenar ref
      const vidToClean = activeVid;
      setTimeout(() => {
        if (vidToClean.classList.contains('inactive')) {
          vidToClean.pause();
          vidToClean.src = "";
          vidToClean.load();
          vidToClean.style.transition = "";
        }
      }, 1600);
    }

    // --- alan wake ---
    async function typeText(elementId, text, speed = null, runId) {
      const el = $(elementId); if(!el) return;
      el.textContent = ""; el.classList.add("cursor");
      
      // UX profile sem speed definida
      if (speed === null) {
        speed = (STATE.ux && STATE.ux.typeSpeed) ? STATE.ux.typeSpeed : 30;
      }
      
      for (let i = 0; i < text.length; i++) {
        checkState(runId); el.textContent += text[i];
        let delay = speed; const char = text[i];
        if (".?!".includes(char)) delay = speed * 12;
        else if (",;".includes(char)) delay = speed * 5;
        else if (char === "\n") delay = speed * 8;
        delay += (Math.random() * 10); 
        await wait(delay);
      }
      el.classList.remove("cursor");
    }

    // --- nav ---
    async function transitionTo(screenId, setupFn = null) {
      STATE.runId++; const currentRunId = STATE.runId;

      const active = document.querySelector(".screen.active");
      if (active) {
        active.classList.remove("visible"); active.classList.add("exit");
        await wait(400); checkState(currentRunId);
        active.style.display = "none"; active.classList.remove("active", "exit");
      }

      const next = $(screenId);
      next.style.display = "block"; next.classList.add("active");
      void next.offsetWidth; next.classList.add("visible");
      
      if (setupFn) {
        try { await setupFn(currentRunId); } catch (e) { if (e.message !== "SESSION_ABORTED") console.error(e); }
      }
    }

    // --- scenes ---
    async function scene1(rid) {
      STATE.ux = UX_PROFILE.default;
      await wait(500); await typeText("t1_1", "Isto não é um começo.", null, rid);
      await wait(400); await typeText("t1_2", "É onde você já chegou.", null, rid);
      await wait(600); revealActions("s1");
    }

    async function scene2(rid) {
      STATE.ux = UX_PROFILE.default;
      await wait(500); await typeText("t2_1", "Não foi concedido.", null, rid);
      await wait(300); await typeText("t2_2", "Foi construído.", null, rid);
      await wait(600); revealActions("s2");
    }

    async function scene3(rid) {
      preloadVideos(); 
      const container = $("choice_container"); container.innerHTML = "";
      
      CHOICES.forEach((c, idx) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn"; btn.textContent = c.label; btn.dataset.choice = c.id; 
        container.appendChild(btn);
        
        setTimeout(() => {
          if(STATE.runId === rid) { btn.style.opacity = "1"; btn.style.transform = "translateY(0)"; }
        }, 300 + (idx * 150));
      });

      // Setup dos listeners de hold
      await wait(400);
      if (STATE.runId === rid) {
        setupHoldListeners();
      }
    }

    async function scene4(rid) {
      // Se tu pressionar e segura, ele já vai pro meu game desgner
      if (STATE.secret) {
        // No render s4, va direto pro s7
        await transitionTo("s7", scene7);
        return;
      }

      // fluxo normal
      const data = STATE.choice; 
      $("res_title").textContent = data.title;
      
      // ativar o UX profile
      STATE.ux = UX_PROFILE[STATE.choice.id] || UX_PROFILE.default;
      
      await wait(500); 
      await typeText("res_1", data.lines[0], null, rid);
      await wait(400); 
      await typeText("res_2", data.lines[1], null, rid);
      await wait(800); 
      await typeText("res_3", data.lines[2], null, rid);
      await wait(600); 
      revealActions("s4");
    }

    // tela 5 animada
    async function scene5(rid) {
      const texts = ENDINGS[STATE.choice.id];
      
      await wait(500); await typeText("t5_1", texts.s5_1, null, rid);
      await wait(300); await typeText("t5_2", texts.s5_2, null, rid);
      await wait(600); revealActions("s5");
    }

    async function doSilence(rid) {
      const current = document.querySelector(".screen.active");
      if(current) current.classList.remove("visible");

      const overlay = $("silence-overlay"); overlay.classList.add("active");
      await wait(800); checkState(rid);

      const line = $("breath_line");
      line.style.transition = "width 2.5s ease-in-out, opacity 2.5s ease-in-out";
      line.style.width = "60px"; line.style.opacity = "0.8";

      await wait(2500); checkState(rid);
      line.style.width = "0px"; line.style.opacity = "0";

      await wait(1000); checkState(rid);
      overlay.classList.remove("active"); await transitionTo("s6", scene6);
    }

    // tela 6 (final) animado
    async function scene6(rid) {
      $("badge_display").textContent = STATE.choice ? STATE.choice.badge : "";
      
      const texts = ENDINGS[STATE.choice.id];
      $("final_word").textContent = texts.word;
      
      await typeText("final_1", texts.s6_1, null, rid);
      await wait(400); await typeText("final_2", texts.s6_2, null, rid);
      
      await wait(1200); checkState(rid);
      $("final_word").classList.add("reveal");
      
      await wait(1500); checkState(rid);
      revealActions("s6"); $("final_footer").classList.add("visible");
    }

    // tala 7, meu game designer
    async function scene7(rid) {
      $("secret_title").textContent = "—";
      
      await wait(300); 
      await typeText("secret_1", SECRET_ENDING.s7_1, null, rid);
      await wait(400); 
      await typeText("secret_2", SECRET_ENDING.s7_2, null, rid);
      
      await wait(800); 
      revealActions("s7");
    }

    function revealActions(screenId) {
      const section = $(screenId); const acts = section.querySelector(".actions");
      if(acts) acts.classList.add("visible");
    }

    // --- tu pressionar e segura pra ativer meu game designer ---
    function setupHoldListeners() {
      $$(".choice-btn").forEach(btn => {
        btn.removeEventListener("pointerdown", handleHoldStart);
        btn.removeEventListener("pointerup", handleHoldEnd);
        btn.removeEventListener("pointercancel", handleHoldEnd);
        btn.removeEventListener("click", handleChoiceClick);
      });
      $$(".choice-btn").forEach(btn => {
        btn.addEventListener("pointerdown", handleHoldStart, { passive: false });
        btn.addEventListener("pointerup", handleHoldEnd, { passive: false });
        btn.addEventListener("pointercancel", handleHoldEnd, { passive: false });
        btn.addEventListener("click", handleChoiceClick, { passive: false });
      });
    }

    function handleHoldStart(e) {
      if (STATE.isTransitioning) return;
      const btn = e.target.closest(".choice-btn");
      if (!btn) return;
      e.preventDefault();
      btn._holdStartTime = Date.now();
      btn._isHolding = false;
      STATE.holdTimer = setTimeout(() => {
        if (STATE.isTransitioning) return;
        btn._isHolding = true;
        STATE.secret = true;
        const choiceId = btn.dataset.choice;
        STATE.choice = CHOICES.find(c => c.id === choiceId);
        STATE.ux = UX_PROFILE[choiceId] || UX_PROFILE.default;
        document.documentElement.dataset.impact = "true";
        const currentRunId = STATE.runId;
        setBackgroundVideo(choiceId, currentRunId).then(() => {
          setTimeout(() => {
            if (STATE.runId !== currentRunId) return;
            document.documentElement.dataset.route = choiceId;
            document.documentElement.dataset.impact = "recover";
            setTimeout(() => {
              if (STATE.runId !== currentRunId) return;
              delete document.documentElement.dataset.impact;
            }, 800);
          }, 150);
        });
        STATE.isTransitioning = true;
        transitionTo("s4", scene4).finally(() => {
          STATE.isTransitioning = false;
        });
      }, 700);
    }


    function handleHoldEnd(e) {
      const btn = e.target.closest(".choice-btn");
      if (!btn) return;
      if (btn._isHolding) {
        btn._isHolding = false;
        btn._holdStartTime = null;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (STATE.holdTimer) {
        clearTimeout(STATE.holdTimer);
        STATE.holdTimer = null;
      }
      if (btn._holdStartTime && Date.now() - btn._holdStartTime < 700) {
        btn._holdStartTime = null;
        e.preventDefault();
        handleChoiceClickAction(btn);
      }
    }


    function handleChoiceClick(e) {
      e.preventDefault();
      e.stopPropagation();
    }



    function handleChoiceClickAction(btn) {
      if (STATE.isTransitioning) return;
      const choiceId = btn.dataset.choice;
      STATE.choice = CHOICES.find(c => c.id === choiceId);
      STATE.ux = UX_PROFILE[choiceId] || UX_PROFILE.default;
      const currentRunId = STATE.runId;
      document.documentElement.dataset.impact = "true";
      STATE.isTransitioning = true;
      setBackgroundVideo(choiceId, currentRunId).then(() => {
        setTimeout(() => {
          if (STATE.runId !== currentRunId) return;
          document.documentElement.dataset.route = choiceId;
          document.documentElement.dataset.impact = "recover";
          setTimeout(() => {
            if (STATE.runId !== currentRunId) return;
            delete document.documentElement.dataset.impact;
          }, 800);
        }, 150);
        transitionTo("s4", scene4).finally(() => {
          STATE.isTransitioning = false;
        });
      }).catch(() => {
        STATE.isTransitioning = false;
      });
    }


    function registerTimer(timerId) {
      STATE.pendingTimers.push(timerId);
    }

    function clearAllTimers() {
      STATE.pendingTimers.forEach(id => clearTimeout(id));
      STATE.pendingTimers = [];
    }

    // --- reset ---
    async function reset() {
      STATE.runId++; 
      STATE.choice = null;
      STATE.secret = false;
      STATE.ux = null;
      
      // limpar o timers pendentes
      clearAllTimers();
      
      // limpar o time de segurar, se existir
      if (STATE.holdTimer) {
        clearTimeout(STATE.holdTimer);
        STATE.holdTimer = null;
      }
      
      STATE.currentVideoSrc = ""; 
      
      delete document.documentElement.dataset.route;
      delete document.documentElement.dataset.impact;
      await setBackgroundVideo("default", STATE.runId);
      STATE.currentVideoSrc = "assets/bg-default.mp4";

      $$(".typewriter").forEach(el => el.textContent = "");
      $$(".actions").forEach(el => el.classList.remove("visible"));
      $$(".screen").forEach(el => { 
        el.style.display = "none"; 
        el.classList.remove("active", "visible", "exit"); 
      });
      
      $("final_word").classList.remove("reveal");
      $("final_word").textContent = ""; 
      $("final_footer").classList.remove("visible");
      
      $("silence-overlay").classList.remove("active");
      $("breath_line").style.width = "0";
      
      await transitionTo("s1", scene1);
    }


    async function handleShare(btn) {
      const shareData = { title: "8 de Março", text: "Não é homenagem. É o que é.", url: window.location.href };
      const original = btn.innerHTML;
      
      try {
        if (navigator.share) {
          try {
            await navigator.share(shareData);
            btn.innerHTML = "<span style='font-size:10px'>COMPARTILHADO</span>";
            setTimeout(() => btn.innerHTML = original, 2000);
          } catch (err) {
            if (err.name !== 'AbortError') {
              throw err;
            }
          }
        } else {
          throw new Error("navigator.share não disponível");
        }
      } catch (err) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareData.url);
            btn.innerHTML = "<span style='font-size:10px'>LINK COPIADO</span>";
            setTimeout(() => btn.innerHTML = original, 2000);
          } else {
            throw new Error("clipboard não disponível");
          }
        } catch (clipErr) {
          try {
            const textarea = document.createElement("textarea");
            textarea.value = shareData.url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            btn.innerHTML = "<span style='font-size:10px'>LINK COPIADO</span>";
            setTimeout(() => btn.innerHTML = original, 2000);
          } catch (execErr) {
            btn.innerHTML = "<span style='font-size:10px'>ERRO</span>";
            setTimeout(() => btn.innerHTML = original, 2000);
          }
        }
      }
    }

    // --- adm de cliques ---
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (STATE.isTransitioning) return; 
      
      STATE.isTransitioning = true; 

      try {
        if (btn.dataset.next) {
          await transitionTo(btn.dataset.next, window[btn.dataset.next.replace("s", "scene")]);
        
        } else if (btn.dataset.choice) {
          // limpar o segura se existir
          if (STATE.holdTimer) {
            clearTimeout(STATE.holdTimer);
            STATE.holdTimer = null;
          }

          const choiceId = btn.dataset.choice;
          STATE.choice = CHOICES.find(c => c.id === choiceId);
          
          // ativa o UX profile
          STATE.ux = UX_PROFILE[choiceId] || UX_PROFILE.default;
          
          const currentRunId = STATE.runId;
          
          // impact effect
          document.documentElement.dataset.impact = "true";
          
          // load a new video
          await setBackgroundVideo(choiceId, currentRunId);
          
          // ativa o caminho depois da troca
          setTimeout(() => {
            if (STATE.runId !== currentRunId) return; 
            document.documentElement.dataset.route = choiceId; 
            document.documentElement.dataset.impact = "recover"; 
            
            setTimeout(() => {
              if (STATE.runId !== currentRunId) return;
              delete document.documentElement.dataset.impact; 
            }, 800);
          }, 150);

          // next screen
          await transitionTo("s4", scene4);
        
        } else if (btn.id === "btn_silence") {
          await doSilence(STATE.runId);
        } else if (btn.id === "btn_restart") {
          await reset();
        } else if (btn.id === "btn_restart_secret") {
          await reset();
        } else if (btn.id === "btn_share") {
          await handleShare(btn);
        }
      } finally { STATE.isTransitioning = false; }
    });

    window.addEventListener('resize', () => {});
    reset();

    // test
    // test
    // test

    // test
    // test
    // test

    // test
    // test
    // test

    // test
    // test
    // test

    // test
    // test
    // test


