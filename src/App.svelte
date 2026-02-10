<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';

  let tools = [];
  let newUrl = "";
  let submitted = false;
  let likeCount = 0;
  const MAX_LIKES = 10;
  let glowingToolName = null;
  let isLoading = true;

  // Base URL for your API. This will be your Cloud Function URL after deployment.
  // For local testing, it will be the emulator URL.
  const apiUrl = 'YOUR_API_BASE_URL'; // e.g., http://127.0.0.1:5001/your-project/us-central1/api

  const colorMap = {
    'from-indigo-500': '#6366f1',
    'to-purple-500': '#a855f7',
    'from-green-400': '#4ade80',
    'to-blue-500': '#3b82f6',
    'from-yellow-400': '#facc15',
    'to-orange-500': '#f97316',
    'from-pink-500': '#ec4899',
    'to-rose-500': '#f43f5e',
    'from-teal-400': '#2dd4bf',
    'to-cyan-500': '#06b6d4',
    'from-red-500': '#ef4444',
    'to-orange-600': '#f97316',
    'from-gray-300': '#d1d5db',
    'to-gray-500': '#6b7280',
    'from-gray-400': '#9ca3af',
    'to-gray-600': '#4b5563'
  };

  async function fetchTools() {
    try {
      const res = await fetch(`${apiUrl}/tools`);
      if (!res.ok) throw new Error(`Failed to fetch tools: ${res.statusText}`);
      tools = await res.json();
    } catch (error) {
      console.error("Error fetching tools:", error);
      // You might want to show an error message to the user here
    } finally {
      isLoading = false;
    }
  }

  onMount(fetchTools);

  async function incrementLikes(tool) {
    if (likeCount >= MAX_LIKES || glowingToolName) return;

    likeCount++;
    glowingToolName = tool.name;

    try {
        const response = await fetch(`${apiUrl}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ toolName: tool.name }),
        });
        if (!response.ok) throw new Error('Failed to update likes');

        // Wait for the glow animation to finish, then refetch tools to get updated likes
        setTimeout(async () => {
            await fetchTools(); // Refetch all data to ensure consistency
            glowingToolName = null;
        }, 3000);

    } catch (error) {
        console.error("Error incrementing likes:", error);
        likeCount--; // Revert optimistic update on error
        glowingToolName = null;
    }
  }

  async function addTool() {
    if (newUrl.trim() === "") return;

    try {
      const response = await fetch(`${apiUrl}/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newUrl }),
      });

      if (response.ok) {
        submitted = true;
        newUrl = '';
      } else {
        console.error("Failed to submit tool:", await response.text());
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting tool:", error);
      alert("An error occurred. Please check the console.");
    }
  }

  $: sortedTools = [...tools].sort((a, b) => {
    if (b.likes === a.likes) {
      // Keep a stable sort for items with the same like count if possible
      // Or randomize as before if that's the desired effect
      return a.name.localeCompare(b.name); 
    }
    return b.likes - a.likes;
  }).slice(0, 10);

  $: topTool = sortedTools[0];
  $: headerStyle = topTool ? `background-image: linear-gradient(to right, ${colorMap[topTool.color.split(' ')[0]] || '#fff'}, ${colorMap[topTool.color.split(' ')[1]] || '#94a3b8'});` : '';

</script>

{#if isLoading}
  <div class="loading-overlay">
    <p>Loading The Elite GUI...</p>
  </div>
{/if}

<header class="max-w-7xl mx-auto text-center mb-20">
  <h1 class="text-6xl md:text-8xl font-extrabold mb-6 gradient-text tracking-tighter" style={headerStyle}>
    The Elite GUI
  </h1>
  <p class="text-gray-400 text-xl md:text-2xl font-light">
    2026年最新：革新的なGUIを誇るAIエディタ TOP 10
  </p>
</header>

<main class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
  {#each sortedTools as tool, i (tool.name)}
    <div
      animate:flip={{duration: 500}}
      class="bento-card rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-300 md:col-span-1 {tool.approved ? '' : 'opacity-50 grayscale'}"
      class:lg:col-span-3={i < 2}
      class:lg:col-span-2={i >= 2}
      class:glowing={glowingToolName === tool.name}
    >
      <!-- Content remains the same -->
      <div>
        <div class="flex justify-between items-center mb-6">
          <span
            class="rank-badge text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-lg shadow-indigo-500/20"
          >
            NO.{i + 1}
          </span>
          <div class="flex flex-wrap gap-2 justify-end">
            {#each tool.tags as tag}
              <span class="text-[10px] border border-gray-800 text-gray-400 px-2 py-1 rounded-full bg-white/5">{tag}</span>
            {/each}
          </div>
        </div>

        <div class="icon-container">
          {@html tool.icon}
        </div>

        <h2 class="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-br {tool.color} bg-clip-text text-transparent">
          {tool.name}
        </h2>
        <p class="text-xs font-bold text-gray-500 mb-6 uppercase tracking-[0.3em]">
          {tool.tagline}
        </p>
        <p class="text-gray-300 leading-relaxed text-sm md:text-base mb-4">
          {tool.desc}
        </p>
      </div>
      <div class="mt-8 flex justify-between items-end">
        <div class="space-y-1">
          <div class="h-1 w-12 rounded-full bg-gradient-to-r {tool.color}"></div>
          <p class="text-[10px] text-gray-600 font-bold uppercase">
            Likes: {tool.likes}
          </p>
        </div>
        {#if tool.approved}
          <button
            on:click={() => incrementLikes(tool)}
            disabled={likeCount >= MAX_LIKES || glowingToolName}
            class="text-sm font-black text-white/40 hover:text-white transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            LIKE <span class="text-2xl group-hover:animate-shake group-disabled:animate-none">👍️</span>
          </button>
        {/if}
      </div>
    </div>
  {/each}
  <div class="bento-card rounded-[2rem] p-8 lg:col-span-6">
    {#if submitted}
      <div class="text-center">
        <h2 class="text-2xl font-bold mb-4">Thank you for your submission!</h2>
        <p class="text-gray-400">Your tool will be reviewed and published after approval.</p>
      </div>
    {:else}
      <div>
        <h2 class="text-2xl font-bold mb-4">Add a new tool</h2>
        <div class="flex gap-4">
          <input type="url" bind:value={newUrl} placeholder="Enter tool URL" class="flex-grow bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button on:click={addTool} class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Add Tool</button>
        </div>
      </div>
    {/if}
  </div>
</main>

<footer class="max-w-7xl mx-auto mt-24 text-center text-gray-600 pb-16">
  <p class="text-sm tracking-widest uppercase mb-4">
    &copy; 2026 AI Interface Alliance. Driven by Design & Logic.
  </p>
  <p class="text-xs">You have {MAX_LIKES - likeCount} likes remaining in this session.</p>
</footer>

<style>
  /* Styles remain the same, but add loading style */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(5, 5, 5, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    color: white;
    font-size: 1.5rem;
  }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

  :global(body) {
    font-family: 'Inter', sans-serif;
    background-color: #050505;
    color: #e5e5e5;
    transition: background-color 0.5s ease;
  }

  .bento-card {
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s, background 0.3s;
  }

  .bento-card:hover {
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-8px) scale(1.01);
    box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.7);
    background: rgba(30, 30, 30, 0.7);
  }

  .rank-badge {
    background: linear-gradient(135deg, #6366f1, #a855f7);
  }

  .gradient-text {
    background: linear-gradient(to right, #fff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    transition: background-image 1s ease;
  }

  .icon-container {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 1.5rem;
  }

  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-15deg); }
    75% { transform: rotate(15deg); }
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  .glowing {
    animation: rainbow-glow 1s ease-in-out 3;
  }

  @keyframes rainbow-glow {
    0%, 100% { box-shadow: 0 0 20px 5px rgba(255, 0, 0, 0.7); }
    15% { box-shadow: 0 0 20px 5px rgba(255, 165, 0, 0.7); }
    30% { box-shadow: 0 0 20px 5px rgba(255, 255, 0, 0.7); }
    45% { box-shadow: 0 0 20px 5px rgba(0, 128, 0, 0.7); }
    60% { box-shadow: 0 0 20px 5px rgba(0, 0, 255, 0.7); }
    75% { box-shadow: 0 0 20px 5px rgba(75, 0, 130, 0.7); }
    90% { box-shadow: 0 0 20px 5px rgba(238, 130, 238, 0.7); }
  }

  :global(::-webkit-scrollbar) {
    width: 8px;
  }
  :global(::-webkit-scrollbar-track) {
    background: #050505;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: #333;
    border-radius: 4px;
  }
</style>
