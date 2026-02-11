<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';

  let posts = [];
  let username = 'Anonymous';
  let newComment = '';
  let isLoading = true;

  // State for inline editing
  let editingPostId = null;
  let editText = '';

  const apiUrl = 'https://us-central1-best-10-ide-22445562-d228a.cloudfunctions.net/api/bbs';

  onMount(async () => {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      posts = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  async function handleSubmit() {
    if (!newComment.trim()) return;
    const newPost = {
      id: `post-${Date.now()}`,
      username: username.trim() || 'Anonymous',
      timestamp: new Date().toISOString(),
      content: newComment.trim(),
    };
    posts = [newPost, ...posts];
    newComment = '';
    try {
      await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPost) });
    } catch (err) {
      console.error("Submit Error:", err);
    }
  }

  function startEditing(post) {
    editingPostId = post.id;
    editText = post.content;
  }

  function cancelEditing() {
    editingPostId = null;
    editText = '';
  }

  async function handleUpdate(postId) {
    if (!editText.trim()) return;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const updatedPost = { ...posts[postIndex], content: editText };
    posts[postIndex] = updatedPost;
    cancelEditing();

    try {
      await fetch(`${apiUrl}/${postId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: editText }) });
    } catch (err) {
      console.error("Update Error:", err);
    }
  }

  async function handleDelete(postId) {
    posts = posts.filter(p => p.id !== postId);
    try {
      await fetch(`${apiUrl}/${postId}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Delete Error:", err);
    }
  }

</script>

<main class="main-container">
    <a href="/" class="back-link">&larr; Back to Rankings</a>
    <div class="grid-container">
        <!-- Submission Card -->
        <div class="card form-card">
            <textarea bind:value={newComment} class="textarea-field" placeholder="Share something simple..."></textarea>
            <div class="form-footer">
                <button on:click={handleSubmit} class="submit-btn">Post</button>
            </div>
        </div>

        <!-- Post Cards -->
        {#each posts.slice(0, 8) as post (post.id)}
            <div animate:flip={{duration: 500}} class="card">
                {#if editingPostId === post.id}
                    <div class="edit-view">
                        <textarea bind:value={editText} class="textarea-field edit-area"></textarea>
                        <div class="edit-actions">
                            <button on:click={() => handleUpdate(post.id)} class="edit-btn save">Save</button>
                            <button on:click={cancelEditing} class="edit-btn cancel">Cancel</button>
                        </div>
                    </div>
                {:else}
                    <p class="card-content">{post.content}</p>
                    <div class="card-footer">
                        <span>{post.username}</span>
                        <div class="card-actions">
                            <button on:click={() => startEditing(post)} class="action-btn">Edit</button>
                            <button on:click={() => handleDelete(post.id)} class="action-btn delete">Delete</button>
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</main>

<style>
  :global(body) { background-color: #0F0F0F; color: #e5e5e5; font-family: 'Inter', sans-serif; }
  .main-container { padding: 2rem; min-height: 100vh; }
  .back-link { position: fixed; top: 1rem; left: 1rem; color: #6b7280; text-decoration: none; font-size: 0.875rem; z-index: 10; }
  .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; max-width: 1300px; margin: 2rem auto; }

  .card { background: #1C1C1C; border: 1px solid #333; border-radius: 1rem; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; aspect-ratio: 1 / 1; transition: all 0.2s ease-out; position: relative; }
  .card:hover { transform: translateY(-4px); border-color: #555; }
  
  .card-content { margin: 0; font-size: 1rem; line-height: 1.6; white-space: pre-wrap; overflow-y: auto; flex-grow: 1; }
  .card-footer { font-size: 0.8rem; color: #888; padding-top: 1rem; border-top: 1px solid #333; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; }
  
  .form-card { border-color: #4A90E2; }
  .textarea-field { width: 100%; background: transparent; border: none; color: white; font-size: 1rem; resize: none; }
  .textarea-field:focus { outline: none; }
  .form-card .textarea-field { flex-grow: 1; }
  .form-card .form-footer { border: none; padding: 0; margin-top: 1rem; }
  .submit-btn { width: 100%; padding: 0.75rem; background: #4A90E2; color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; }

  /* Edit/Delete Actions */
  .action-btn { background: none; border: 1px solid #444; color: #888; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
  .action-btn:hover { color: white; border-color: #666; }
  .action-btn.delete:hover { color: #ff5e5e; border-color: #ff5e5e; }
  .card-actions { display: flex; gap: 0.5rem; }

  /* Edit View */
  .edit-view { display: flex; flex-direction: column; height: 100%; }
  .edit-area { flex-grow: 1; margin-bottom: 1rem; }
  .edit-actions { display: flex; gap: 0.5rem; }
  .edit-btn { flex-grow: 1; padding: 0.5rem; border-radius: 0.5rem; border: none; font-weight: bold; cursor: pointer; }
  .edit-btn.save { background: #34A853; color: white; }
  .edit-btn.cancel { background: #555; color: #ddd; }
</style>