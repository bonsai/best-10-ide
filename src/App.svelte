<script>
  import { onMount, onDestroy } from 'svelte';
  import { flip } from 'svelte/animate';
  import initialToolsData from '../data/tools.json';

  let tools = [];
  let newUrl = "";
  let submitted = false;
  let sessionLikeCount = 0;
  const MAX_LIKES_PER_SESSION = 10;
  let glowingToolName = null;
  let isLoading = true;
  let submitMessage = "";
  let submitStatus = ""; // 'success' or 'error'

  // APIのベースURL（デプロイ後に実際のURLに置き換えてください）
  const apiUrl = 'https://us-central1-best-10-ide-22445562-d228a.cloudfunctions.net/api'; 

  let pendingLikes = {};
  let likeBatchInterval = null;
  let isSendingBatch = false;

  onMount(async () => {
    try {
      // APIからデータを取得しようと試みる
      const res = await fetch(`${apiUrl}/tools`);
      if (res.ok) {
        tools = await res.json();
      } else {
        throw new Error('API request failed');
      }
    } catch (e) {
      console.warn("API unavailable, using local fallback data:", e);
      tools = initialToolsData;
    } finally {
      isLoading = false;
    }

    // Implement batch sending for likes
    function sendLikeBatch() {
        if (isSendingBatch || Object.keys(pendingLikes).length === 0) return;
        
        isSendingBatch = true;
        const batchToSend = { ...pendingLikes };
        pendingLikes = {}; // Reset pending likes

        fetch(`${apiUrl}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ likes: batchToSend })
        })
        .then(res => {
            if (!res.ok) {
                // If failed, merge back to pendingLikes
                console.error("Batch update failed");
                pendingLikes = { ...batchToSend, ...pendingLikes };
            }
        })
        .catch(err => {
            console.error("Batch update error", err);
            pendingLikes = { ...batchToSend, ...pendingLikes };
        })
        .finally(() => {
            isSendingBatch = false;
        });
    }

    // Start batch interval
    likeBatchInterval = setInterval(sendLikeBatch, 5000); // Send every 5 seconds

    return () => {
        clearInterval(likeBatchInterval);
        sendLikeBatch(); // Send remaining likes on unmount
    };
  });

  function handleLike(tool) {
    if (sessionLikeCount >= MAX_LIKES_PER_SESSION) {
      alert("セッションごとの「いいね」上限に達しました！");
      return;
    }

    // Update local state optimistically
    const index = tools.findIndex(t => t.name === tool.name);
    if (index !== -1) {
        tools[index].likes = (tools[index].likes || 0) + 1;
        sessionLikeCount++;
    }
    
    // Add to pending likes
    pendingLikes[tool.name] = (pendingLikes[tool.name] || 0) + 1;

    // Flash effect
    glowingToolName = tool.name;
    setTimeout(() => glowingToolName = null, 500);
  }

  async function handleSubmit() {
    if (!newUrl) return;
    submitted = true;
    submitMessage = "";
    submitStatus = "";
    
    try {
        const res = await fetch(`${apiUrl}/url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: newUrl })
        });
        
        if (res.ok) {
            submitMessage = "ありがとうございます！審査後に掲載されます。";
            submitStatus = "success";
            setTimeout(() => {
                newUrl = "";
                submitted = false;
                submitMessage = "";
                submitStatus = "";
            }, 3000);
        } else {
            throw new Error('Submission failed');
        }
    } catch (e) {
        submitMessage = "送信に失敗しました。後でもう一度お試しください。";
        submitStatus = "error";
        submitted = false;
        setTimeout(() => {
            submitMessage = "";
            submitStatus = "";
        }, 3000);
    }
  }
</script>

<main class="min-h-screen bg-[#050505] text-gray-200 p-4 sm:p-8 font-sans selection:bg-indigo-500/30">
    <div class="max-w-7xl mx-auto space-y-12">
        <!-- Header -->
        <header class="text-center space-y-4 py-12 relative overflow-hidden">
             <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
             <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight relative z-10">
                <span class="gradient-text block mb-2">AI Code Editor</span>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">GUI Rankings 2026</span>
             </h1>
             <p class="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto relative z-10">
                次世代の開発体験を定義する、最も革新的なツールたち。
             </p>
        </header>

        {#if isLoading}
            <div class="loading-overlay">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-lg font-medium animate-pulse">Loading Rankings...</p>
                </div>
            </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each tools as tool (tool.name)}
                <div 
                    animate:flip="{{duration: 400}}"
                    class="bento-card relative rounded-3xl p-6 h-full flex flex-col gap-4 group overflow-hidden {glowingToolName === tool.name ? 'glowing' : ''}"
                >
                    <!-- Background Gradient Blob -->
                    <div class="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br {tool.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500"></div>

                    <!-- Header: Rank & Icon -->
                    <div class="flex justify-between items-start z-10">
                        <div class="rank-badge w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
                            #{tool.rank}
                        </div>
                        <div class="icon-container text-white/80">
                            {@html tool.icon}
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="space-y-2 z-10 flex-grow">
                        <h2 class="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {tool.name}
                        </h2>
                        <p class="text-sm font-medium text-indigo-200/80 uppercase tracking-wider">
                            {tool.tagline}
                        </p>
                        <p class="text-gray-400 text-sm leading-relaxed line-clamp-3">
                            {tool.desc}
                        </p>
                    </div>

                    <!-- Tags -->
                    <div class="flex flex-wrap gap-2 z-10">
                        {#each tool.tags as tag}
                            <span class="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
                                {tag}
                            </span>
                        {/each}
                    </div>

                    <!-- Action Footer -->
                    <div class="pt-4 border-t border-white/5 flex items-center justify-between z-10">
                         <button 
                            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-400 transition-all active:scale-95"
                            on:click={() => handleLike(tool)}
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="{tools.find(t => t.name === tool.name)?.likes > 0 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            <span class="font-mono">{tool.likes || 0}</span>
                         </button>
                         {#if tool.url}
                             <a href="{tool.url}" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                                Visit <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                             </a>
                         {/if}
                    </div>
                </div>
            {/each}
        </div>

        <!-- Submission Section -->
        <section class="max-w-2xl mx-auto pt-16 text-center space-y-6 pb-20">
            <h3 class="text-2xl font-bold text-white">あなたの推しツールを教えてください</h3>
            <div class="flex flex-col sm:flex-row gap-4">
                <input 
                    type="url" 
                    bind:value={newUrl} 
                    placeholder="https://example.com" 
                    class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                />
                <button 
                    on:click={handleSubmit}
                    disabled={submitted || !newUrl}
                    class="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {submitted ? '送信完了' : '推薦する'}
                </button>
            </div>
            {#if submitMessage}
                <div class="mt-4 p-4 rounded-xl {submitStatus === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'}">
                    {submitMessage}
                </div>
            {/if}
        </section>
        
        <footer class="text-center text-gray-600 text-sm py-12 border-t border-white/5 mt-12">
            © 2026 AI Code Editor Rankings. Powered by Trae & Svelte.
        </footer>
    </div>
</main>

<style>
.loading-overlay.svelte-ltnjvt{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5, 5, 5, 0.8);display:flex;justify-content:center;align-items:center;z-index:9999;color:white;font-size:1.5rem}.bento-card.svelte-ltnjvt{background:rgba(20, 20, 20, 0.6);border:1px solid rgba(255, 255, 255, 0.1);backdrop-filter:blur(10px);transition:all 0.3s}.bento-card.svelte-ltnjvt:hover{border-color:rgba(255, 255, 255, 0.4);transform:translateY(-8px) scale(1.01);box-shadow:0 20px 40px -20px rgba(0, 0, 0, 0.7);background:rgba(30, 30, 30, 0.7)}.rank-badge.svelte-ltnjvt{background:linear-gradient(135deg, #6366f1, #a855f7)}.gradient-text.svelte-ltnjvt{background:linear-gradient(to right, #fff, #94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;transition:background-image 1s ease}.icon-container.svelte-ltnjvt{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(255, 255, 255, 0.05);margin-bottom:1.5rem}@keyframes svelte-ltnjvt-shake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-15deg)}75%{transform:rotate(15deg)}}.animate-shake.svelte-ltnjvt{animation:svelte-ltnjvt-shake 0.5s ease-in-out}.glowing.svelte-ltnjvt{animation:svelte-ltnjvt-rainbow-glow 1s ease-in-out 3}@keyframes svelte-ltnjvt-rainbow-glow{0%,100%{box-shadow:0 0 20px 5px rgba(255, 0, 0, 0.7)}15%{box-shadow:0 0 20px 5px rgba(255, 165, 0, 0.7)}30%{box-shadow:0 0 20px 5px rgba(255, 255, 0, 0.7)}45%{box-shadow:0 0 20px 5px rgba(0, 128, 0, 0.7)}60%{box-shadow:0 0 20px 5px rgba(0, 0, 255, 0.7)}75%{box-shadow:0 0 20px 5px rgba(75, 0, 130, 0.7)}90%{box-shadow:0 0 20px 5px rgba(238, 130, 238, 0.7)}}::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:#050505}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
</style>
