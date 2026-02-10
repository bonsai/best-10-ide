<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';

  let tools = [];
  let newUrl = "";

  onMount(async () => {
    const res = await fetch('./src/tools.json');
    tools = await res.json();
  });

  function incrementLikes(tool) {
    tool.likes++;
    tools = tools.sort((a, b) => b.likes - a.likes);
  }

  function addTool() {
    if (newUrl.trim() !== "") {
      tools = [
        ...tools,
        {
          rank: tools.length + 1,
          name: "New Tool",
          tagline: "Pending Approval",
          desc: "This tool is pending approval from the administrator.",
          tags: ["New"],
          color: "from-gray-400 to-gray-600",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
          likes: 0,
          url: newUrl,
          approved: false,
        },
      ];
      newUrl = "";
    }
  }

  $: sortedTools = [...tools].sort((a, b) => b.likes - a.likes);
</script>

<header class="max-w-7xl mx-auto text-center mb-20">
  <h1 class="text-6xl md:text-8xl font-extrabold mb-6 gradient-text tracking-tighter">
    The Elite GUI
  </h1>
  <p class="text-gray-400 text-xl md:text-2xl font-light">
    2026年最新：革新的なGUIを誇るAIエディタ TOP 10
  </p>
</header>

<main class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
  <div class="bento-card rounded-[2rem] p-8 lg:col-span-6">
    <h2 class="text-2xl font-bold mb-4">Add a new tool</h2>
    <div class="flex gap-4">
      <input
        type="text"
        bind:value={newUrl}
        placeholder="Enter tool URL"
        class="flex-grow bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        on:click={addTool}
        class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        Add Tool
      </button>
    </div>
  </div>

  {#each sortedTools as tool, i (tool.name)}
    <div
      animate:flip={{duration: 300}}
      class="bento-card rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-300 {tool.approved
        ? ''
        : 'opacity-50 grayscale'} {i === sortedTools.length - 1 && i !== 0
        ? 'grayscale'
        : ''}"
      class:lg:col-span-3={i < 2}
      class:lg:col-span-2={i >= 2}
      class:md:col-span-1
    >
      <div>
        <div class="flex justify-between items-center mb-6">
          <span
            class="rank-badge text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-lg shadow-indigo-500/20"
          >
            NO.{i + 1}
          </span>
          <div class="flex flex-wrap gap-2 justify-end">
            {#each tool.tags as tag}
              <span
                class="text-[10px] border border-gray-800 text-gray-400 px-2 py-1 rounded-full bg-white/5"
                >{tag}</span
              >
            {/each}
          </div>
        </div>

        <div class="icon-container">
          {@html tool.icon}
        </div>

        <h2
          class="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-br {tool.color} bg-clip-text text-transparent"
        >
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
          <div
            class="h-1 w-12 rounded-full bg-gradient-to-r {tool.color}"
          ></div>
          <p class="text-[10px] text-gray-600 font-bold uppercase">
            Likes: {tool.likes}
          </p>
        </div>
        {#if tool.approved}
          <button
            on:click={() => incrementLikes(tool)}
            class="text-sm font-black text-white/40 hover:text-white transition-all flex items-center gap-2 group"
          >
            LIKE <span class="text-2xl group-hover:animate-shake">👍️</span>
          </button>
        {/if}
      </div>
    </div>
  {/each}
</main>

<footer class="max-w-7xl mx-auto mt-24 text-center text-gray-600 pb-16">
  <p class="text-sm tracking-widest uppercase">
    &copy; 2026 AI Interface Alliance. Driven by Design & Logic.
  </p>
</footer>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

  :global(body) {
    font-family: 'Inter', sans-serif;
    background-color: #050505;
    color: #e5e5e5;
  }

  .bento-card {
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
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