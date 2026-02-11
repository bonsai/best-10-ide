
<script>
  import { onMount, onDestroy } from 'svelte';
  import { flip } from 'svelte/animate';
  import initialToolsData from '../data/tools.json';

  let tools = [];
  let newUrl = "";
  let rainbowGlowToolName = null;
  let isLoading = true;
  let submitMessage = "";
  let submitStatus = ""; // 'success' or 'error' or 'submitting'

  const apiUrl = 'https://us-central1-best-10-ide-22445562-d228a.cloudfunctions.net/api'; 

  let pendingLikes = {};
  let likeBatchInterval = null;
  let isSendingBatch = false;

  // For dynamic background
  let topToolColor = "#111827";
  const colorMap = {
      'blue-400': '#60A5FA', 'indigo-600': '#4F46E5', 'cyan-400': '#22D3EE', 
      'blue-500': '#3B82F6', 'green-400': '#4ADE80', 'emerald-600': '#059669',
      'purple-400': '#A78BFA', 'pink-600': '#DB2777', 'indigo-400': '#818CF8', 
      'purple-500': '#A855F7', 'sky-500': '#0EA5E9', 'blue-700': '#1D4ED8',
      'red-500': '#EF4444', 'orange-500': '#F97316', 'gray-300': '#D1D5DB', 
      'gray-500': '#6B7280', 'yellow-400': '#FACC15', 'orange-600': '#EA580C',
      'teal-400': '#2DD4BF'
  };

  function updateTopToolColor() {
      if (tools.length > 0 && tools[0].color) {
          const topTool = tools[0];
          const fromColorName = topTool.color.split(' ')[0].replace('from-', '');
          topToolColor = colorMap[fromColorName] || '#1f2937';
      }
  }

  onMount(async () => {
    try {
      const res = await fetch(`${apiUrl}/tools`);
      if (!res.ok) throw new Error('API fetch failed');
      const data = await res.json();
      tools = data.sort((a, b) => (b.likes || 0) - (a.likes || 0)).map((tool, index) => ({ ...tool, rank: index + 1 }));
    } catch (e) {
      console.warn("API unavailable, using local fallback data:", e);
      tools = initialToolsData.sort((a, b) => (b.likes || 0) - (a.likes || 0)).map((tool, index) => ({ ...tool, rank: index + 1 }));
    } finally {
      updateTopToolColor();
      isLoading = false;
    }

    likeBatchInterval = setInterval(() => {
        if (isSendingBatch || Object.keys(pendingLikes).length === 0) return;
        
        isSendingBatch = true;
        const batchToSend = { ...pendingLikes };
        pendingLikes = {};

        fetch(`${apiUrl}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ likes: batchToSend })
        })
        .catch(err => {
            console.error("Batch update error, merging back likes", err);
            pendingLikes = { ...batchToSend, ...pendingLikes };
        })
        .finally(() => { isSendingBatch = false; });
    }, 5000);

    return () => {
      clearInterval(likeBatchInterval);
    };
  });

  function handleLike(tool) {
    const index = tools.findIndex(t => t.name === tool.name);
    if (index !== -1) {
        tools[index].likes = (tools[index].likes || 0) + 1;
        tools = tools;
        pendingLikes[tool.name] = (pendingLikes[tool.name] || 0) + 1;
        
        rainbowGlowToolName = tool.name;
        setTimeout(() => rainbowGlowToolName = null, 3000);

        setTimeout(() => {
            tools = tools.sort((a, b) => (b.likes || 0) - (a.likes || 0)).map((t, i) => ({ ...t, rank: i + 1 }));
            updateTopToolColor();
        }, 300);
    }
  }

  async function handleSubmit() {
    if (!newUrl || !newUrl.startsWith('https://')) {
        submitStatus = 'error';
        submitMessage = "有効なhttps://URLを入力してください。";
        setTimeout(() => { submitStatus = ""; submitMessage = ""; }, 3000);
        return;
    }
    submitStatus = 'submitting';
    submitMessage = '送信中...';
    
    try {
        const res = await fetch(`${apiUrl}/url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: newUrl })
        });
        
        if (res.ok) {
            submitStatus = 'success';
            submitMessage = "ありがとうございます！審査後に掲載されます。";
        } else {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Submission failed');
        }
    } catch (e) {
        submitStatus = 'error';
        submitMessage = `送信失敗: ${e.message}`;
    } finally {
        setTimeout(() => {
            newUrl = "";
            submitStatus = "";
            submitMessage = "";
        }, 4000);
    }
  }

    function getIconColor(toolColor) {
        if (!toolColor) return '#A5B4FC'; // default color
        const fromColorName = toolColor.split(' ')[0].replace('from-', '');
        return colorMap[fromColorName] || '#A5B4FC';
    }

</script>

<main 
    class="main-container"
    style="--glow-color: {topToolColor};"
>
    <div class="max-w-7xl mx-auto space-y-12 p-4 sm:p-8">
        <header class="text-center space-y-4 py-12 relative overflow-hidden">
             <div class="header-glow"></div>
             <h1 class="text-5xl sm:text-7xl font-extrabold tracking-tighter relative z-10">
                <span class="gradient-text-header block mb-2">AI Code Editor</span>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 text-4xl sm:text-5xl">GUI Rankings 2026</span>
             </h1>
             <p class="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto relative z-10">
                次世代の開発体験を定義する、最も革新的なツールたち。
             </p>
        </header>

        {#if isLoading}
            <div class="loading-overlay">
                <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each tools as tool (tool.name)}
                <div 
                    animate:flip={{duration: 700}}
                    class="bento-card"
                    class:rainbow-active={rainbowGlowToolName === tool.name}
                >
                    <div class="card-glow" style="background-image: linear-gradient(to right, {(tool.color || 'from-gray-500 to-gray-700').split(' ')[0].replace('from-', 'var(--color-')}), {(tool.color || 'from-gray-500 to-gray-700').split(' ')[1].replace('to-', 'var(--color-')})"></div>
                    <div class="flex justify-between items-start z-10">
                        <div class="rank-badge">#{tool.rank}</div>
                        <div class="icon-container" style="color: {getIconColor(tool.color)}">{@html tool.icon.replace(/class=".*?"/, '') || ''}</div>
                    </div>
                    <div class="space-y-2 z-10 flex-grow">
                        <h2 class="text-2xl font-bold text-white">{tool.name}</h2>
                        <p class="text-sm font-medium text-indigo-300/80 uppercase tracking-wider">{tool.tagline}</p>
                        <p class="text-gray-400 text-sm leading-relaxed">{tool.desc}</p>
                    </div>
                    <div class="flex flex-wrap gap-2 z-10">
                        {#if tool.tags}
                            {#each tool.tags as tag}
                                <span class="tag"> {tag} </span>
                            {/each}
                        {/if}
                    </div>
                    <div class="pt-4 border-t border-white/5 flex items-center justify-between z-10">
                         <button class="like-button" on:click={() => handleLike(tool)}>
                            <svg class="like-icon" class:liked={tool.likes > (initialToolsData.find(t=>t.name === tool.name)?.likes || 0)} viewBox="0 0 24 24">
                                <path d="M7 10v12"/>
                                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z"/>
                            </svg>
                            <span class="font-mono text-lg">{tool.likes || 0}</span>
                         </button>
                         {#if tool.url}
                             <a href="{tool.url}" target="_blank" rel="noopener noreferrer" class="visit-link">
                                Visit <svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 7h10v10M7 17 17 7"/></svg>
                             </a>
                         {/if}
                    </div>
                </div>
            {/each}

            <!-- Submission Card -->
            <div class="bento-card submit-card">
                 <div class="space-y-4 z-10 flex-grow">
                    <h2 class="text-2xl font-bold text-white">あなたの推しツールは？</h2>
                    <p class="text-gray-400 text-sm">ランキングにない最高のツールを推薦してください。</p>
                 </div>
                 <div class="z-10 mt-auto">
                    {#if submitStatus === 'success'}
                        <div class="text-center p-4 rounded-xl bg-green-500/20 text-green-300">
                           {submitMessage}
                        </div>
                    {:else if submitStatus === 'error'}
                         <div class="text-center p-4 rounded-xl bg-red-500/20 text-red-300">
                           {submitMessage}
                        </div>
                    {:else}
                        <div class="flex flex-col sm:flex-row gap-3">
                            <input type="url" bind:value={newUrl} placeholder="https://example.com" class="submit-input"/>
                            <button on:click={handleSubmit} disabled={submitStatus === 'submitting'} class="submit-button">
                                {submitStatus === 'submitting' ? '送信中...' : '推薦する'}
                            </button>
                        </div>
                    {/if}
                 </div>
            </div>
            
            <!-- BBS Card -->
            <a href="/bbs.html" class="bento-card bbs-card">
                 <div class="space-y-4 z-10 flex-grow">
                    <h2 class="text-2xl font-bold text-white">Community Wiki</h2>
                    <p class="text-gray-400 text-sm">ツールについて語り、開発者と繋がろう。</p>
                 </div>
                 <div class="z-10 mt-auto flex items-center justify-end text-cyan-300 font-semibold">
                    <span>BBSへ</span>
                    <svg class="w-5 h-5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                 </div>
            </a>

        </div>
        
        <footer class="text-center text-gray-600 text-sm py-12 border-t border-white/5 mt-12">
            © 2026 AI Code Editor Rankings. Powered by Gemini & Svelte.
        </footer>
    </div>
</main>

<style>
  :root { --glow-color: #1f2937; }
  :global(body) {
    font-family: 'Inter', sans-serif;
    background-color: #050505;
    color: #e5e5e5;
    overflow-y: scroll;
  }
  .main-container {
      min-height: 100vh;
      background-image: radial-gradient(circle at 50% 20%, hsla(from var(--glow-color) h s l / 0.25) 0%, #050505 40%);
      animation: pulse-background 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      transition: --glow-color 1.5s ease;
  }
  @property --glow-color { syntax: '<color>'; initial-value: #1f2937; inherits: false; }
  @keyframes pulse-background {
      50% { background-size: 120% 120%; }
  }
  .header-glow {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 50vw; height: 400px;
      background-image: radial-gradient(circle, hsla(from var(--glow-color) h s l / 0.15), transparent 70%);
      pointer-events: none;
  }
  .gradient-text-header {
    background-image: linear-gradient(to right, #ffffff, #b8c2d7);
    -webkit-background-clip: text;
    color: transparent;
  }
  .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(5, 5, 5, 0.9); display: flex; justify-content: center; align-items: center; z-index: 9999; }
  
  .bento-card {
    background: rgba(23, 23, 23, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
    border-radius: 1.5rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    text-decoration: none;
    color: inherit;
  }
  .bento-card:hover {
      transform: translateY(-8px);
      border-color: rgba(255, 255, 255, 0.2);
  }
  .card-glow {
      position: absolute; top: -50%; right: -50%; width: 200%; height: 200%;
      background-image: radial-gradient(circle at 100% 0, transparent, var(--glow-color), transparent);
      opacity: 0;
      transition: opacity 0.5s ease;
  }
  .bento-card:hover .card-glow { opacity: 0.1; }

  .rank-badge {
      width: 3rem; height: 3rem; border-radius: 0.8rem;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: bold;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white; box-shadow: 0 4px 15px -5px #8b5cf6;
  }
  .icon-container svg { width: 24px; height: 24px; stroke-width: 1.5; fill: none; stroke: currentColor; }
  .tag { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; padding: 0.25rem 0.75rem; font-size: 0.75rem; color: #d1d5db; }
  
  .like-button { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 1rem; border-radius: 0.75rem; background: rgba(255,255,255,0.05); transition: all 0.2s ease; border: 1px solid transparent; }
  .like-button:hover { background: rgba(255, 235, 59, 0.1); color: #FFFDE7; }
  
  .like-icon {
      width: 28px; height: 28px; 
      stroke: #9ca3af; fill: none; stroke-width: 1.5;
      transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1.2);
  }
  .like-button:hover .like-icon { animation: shake 0.4s ease-in-out; }
  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-15deg) scale(1.1); }
    75% { transform: rotate(15deg) scale(1.1); }
  }
  .like-icon.liked {
      fill: #FFD600;
      stroke: #FFD600;
      transform: scale(1.2);
  }

  .bento-card.rainbow-active::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 1.5rem; 
      border: 2px solid transparent;
      background: linear-gradient(120deg, red, orange, yellow, green, blue, indigo, violet) border-box;
      background-size: 200% 200%;
      -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: destination-out; mask-composite: exclude;
      animation: rainbow-border-animation 3s ease-out;
  }
  @keyframes rainbow-border-animation {
      0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; opacity: 0; }
  }
  
  .visit-link { font-size: 0.875rem; color: #9ca3af; display: flex; align-items: center; gap: 0.25rem; transition: color 0.2s; }
  .visit-link:hover { color: white; }
  .visit-link svg { stroke: currentColor; stroke-width: 2; fill: none; }

  .submit-card { background: rgba(30, 28, 40, 0.6); border-color: rgba(139, 92, 246, 0.3); }
  .submit-input { flex-grow: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 0.75rem 1rem; color: white; transition: all 0.2s ease; }
  .submit-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5); }
  .submit-button { padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: bold; color: white; background: linear-gradient(to right, #6d28d9, #4f46e5); transition: all 0.2s ease; }
  .submit-button:hover:not(:disabled) { box-shadow: 0 0 20px -5px #8b5cf6; }
  .submit-button:disabled { opacity: 0.5; cursor: not-allowed; }

  .bbs-card {
      background: rgba(10, 30, 40, 0.6);
      border-color: rgba(34, 211, 238, 0.2);
  }
  .bbs-card:hover {
      border-color: rgba(34, 211, 238, 0.6);
      box-shadow: 0 8px 30px -10px rgba(34, 211, 238, 0.3);
  }
</style>
