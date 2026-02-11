<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';

  let tools = [];
  let isLoading = true;

  const apiUrl = '/api_v2/tools';

  onMount(async () => {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch tools');
      tools = await res.json();
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  async function handleLike(toolId) {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    const newLikes = (tool.likes || 0) + 1;
    const originalLikes = tool.likes;
    tool.likes = newLikes; // Optimistic update

    try {
      await fetch(`${apiUrl}/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likes: newLikes })
      });
    } catch (error) {
      console.error('Like Error:', error);
      tool.likes = originalLikes; // Rollback on error
    }
  }
</script>

<main class="main-container">
    <header class="header">
        <h1 class="title">Community Wiki</h1>
        <p class="subtitle">The best community-curated list of dev tools.</p>
        <a href="/bbs" class="bbs-link">Go to BBS &rarr;</a>
    </header>

    <div class="grid-container">
        {#if isLoading}
            <p>Loading tools...</p>
        {/if}
        {#each tools.sort((a, b) => (b.likes || 0) - (a.likes || 0)) as tool (tool.id)}
            <div class="card" animate:flip={{duration: 500}}>
                <a href={tool.url} target="_blank" rel="noopener noreferrer" class="card-link">
                    <div class="card-header {tool.color || 'from-gray-700 to-gray-800'}">
                        <div class="icon" contenteditable="false">{@html tool.icon || ''}</div>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">{tool.name}</h3>
                        <p class="card-tagline">{tool.tagline}</p>
                    </div>
                </a>
                <div class="card-footer">
                    <div class="tags">
                        {#if tool.tags}
                            {#each tool.tags as tag}
                                <span class="tag">#{tag}</span>
                            {/each}
                        {/if}
                    </div>
                    <button class="like-btn" on:click={() => handleLike(tool.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="like-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>
                        <span>{tool.likes || 0}</span>
                    </button>
                </div>
            </div>
        {/each}
    </div>
</main>

<style>
  :global(body) { background-color: #050505; color: #e5e5e5; font-family: 'Inter', sans-serif; }
  .main-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .header { text-align: center; margin-bottom: 4rem; }
  .title { font-size: 3rem; font-weight: 800; letter-spacing: -0.05em; }
  .subtitle { font-size: 1.125rem; color: #a3a3a3; margin-top: 0.5rem; }
  .bbs-link { display: inline-block; margin-top: 1.5rem; color: #38bdf8; text-decoration: none; font-weight: bold; }
  .grid-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }

  .card { background: #171717; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
  .card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); }
  .card-link { text-decoration: none; color: inherit; display: flex; flex-direction: column; flex-grow: 1; }
  .card-header { height: 120px; display: grid; place-items: center; background: linear-gradient(145deg, var(--tw-gradient-from), var(--tw-gradient-to)); }
  .icon :global(svg) { width: 48px; height: 48px; color: white; }
  .card-body { padding: 1.25rem; flex-grow: 1; }
  .card-title { font-size: 1.25rem; font-weight: 700; }
  .card-tagline { color: #a3a3a3; margin-top: 0.25rem; font-size: 0.875rem; }
  .card-footer { padding: 0 1.25rem 1.25rem; display: flex; justify-content: space-between; align-items: center; }
  .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .tag { background: rgba(255, 255, 255, 0.1); padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; }
  .like-btn { background: none; border: 1px solid rgba(255, 255, 255, 0.1); color: #a3a3a3; border-radius: 99px; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; cursor: pointer; transition: all 0.2s; }
  .like-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }
  .like-icon { width: 1rem; height: 1rem; }
</style>
