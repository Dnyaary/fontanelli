        const content = document.getElementById('content');
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;
            content.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        });

        const canvas = document.getElementById('waveCanvas');
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let tempoCanvas = 0;

        function drawInterference() {
            ctx.fillStyle = 'rgba(13, 3, 3, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            tempoCanvas += 0.05;
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 68, 68, ${Math.random() * 0.3})`;
                
                const baseY = canvas.height * (0.2 * (i + 1));
                ctx.moveTo(0, baseY);

                for (let x = 0; x < canvas.width; x += 20) {
                    let spike = (Math.random() > 0.95) ? (Math.random() * 100 - 50) : (Math.random() * 4 - 2);
                    let y = baseY + Math.sin(x * 0.01 + tempoCanvas * (i+1)) * 10 + spike;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            const scanY = (tempoCanvas * 50) % canvas.height;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
            ctx.fillRect(0, scanY, canvas.width, 10);

            requestAnimationFrame(drawInterference);
        }

        drawInterference();

        const idiomas = [
            { texto: "O que você faz aqui, ", destaque: "amigo", fim: "?" },
            { texto: "What are you doing here, ", destaque: "friend", fim: "?" },
            { texto: "你在这里做什么，", destaque: "朋友", fim: "？" },
            { texto: "ここで何をしているの、", destaque: "友よ", fim: "？" },
            { texto: "여기서 뭐하는 거야, ", destaque: "친구", fim: "?" },
            { texto: "Was machst du hier, ", destaque: "Freund", fim: "?" },
            { texto: "¿Qué haces aquí, ", destaque: "amigo", fim: "?" }, 
            { texto: "Che ci fai qui, ", destaque: "amico", fim: "?" },
            { texto: "Que fais-tu ici, ", destaque: "mon ami", fim: " ?" },
            { texto: "Что ты здесь делаешь, ", destaque: "друг", fim: "?" }    
        ];

        const linhaMensagem = document.getElementById('mensagemVazia');
        let indiceIdioma = 0;

        setInterval(() => {
            linhaMensagem.style.opacity = 0;
            
            setTimeout(() => {
                indiceIdioma = (indiceIdioma + 1) % idiomas.length;
                const idiomaAtual = idiomas[indiceIdioma];
                
                linhaMensagem.innerHTML = `${idiomaAtual.texto}<span>${idiomaAtual.destaque}</span>${idiomaAtual.fim}`;
                linhaMensagem.style.opacity = 0.9;
            }, 300);
            
        }, 3000);