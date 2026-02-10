      <script>
        import { onMount, onDestroy } from 'svelte';
        import { flip } from 'svelte/animate';
      
        let tools = [];
        let newUrl = "";
        let submitted = false;
        let sessionLikeCount = 0;
        const MAX_LIKES_PER_SESSION = 10;
       let glowingToolName = null;
       let isLoading = true;
     
       // APIのベースURL（デプロイ後に実際のURLに置き換えてください）
       const apiUrl = 'https://us-central1-best-10-ide-22445562-d228a.cloudfunctions.net/api'; // 例: http://127.0.0.1:5001/your-project/us-central1/api
     
       let pendingLikes = {};
       let likeBatchInterval = null;
       let isSendingBatch = false;
       </script>
<style>
.loading-overlay.svelte-ltnjvt{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5, 5, 5, 0.8);display:flex;justify-content:center;align-items:center;z-index:9999;color:white;font-size:1.5rem}.bento-card.svelte-ltnjvt{background:rgba(20, 20, 20, 0.6);border:1px solid rgba(255, 255, 255, 0.1);backdrop-filter:blur(10px);transition:all 0.3s}.bento-card.svelte-ltnjvt:hover{border-color:rgba(255, 255, 255, 0.4);transform:translateY(-8px) scale(1.01);box-shadow:0 20px 40px -20px rgba(0, 0, 0, 0.7);background:rgba(30, 30, 30, 0.7)}.rank-badge.svelte-ltnjvt{background:linear-gradient(135deg, #6366f1, #a855f7)}.gradient-text.svelte-ltnjvt{background:linear-gradient(to right, #fff, #94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;transition:background-image 1s ease}.icon-container.svelte-ltnjvt{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(255, 255, 255, 0.05);margin-bottom:1.5rem}@keyframes svelte-ltnjvt-shake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-15deg)}75%{transform:rotate(15deg)}}.animate-shake.svelte-ltnjvt{animation:svelte-ltnjvt-shake 0.5s ease-in-out}.glowing.svelte-ltnjvt{animation:svelte-ltnjvt-rainbow-glow 1s ease-in-out 3}@keyframes svelte-ltnjvt-rainbow-glow{0%,100%{box-shadow:0 0 20px 5px rgba(255, 0, 0, 0.7)}15%{box-shadow:0 0 20px 5px rgba(255, 165, 0, 0.7)}30%{box-shadow:0 0 20px 5px rgba(255, 255, 0, 0.7)}45%{box-shadow:0 0 20px 5px rgba(0, 128, 0, 0.7)}60%{box-shadow:0 0 20px 5px rgba(0, 0, 255, 0.7)}75%{box-shadow:0 0 20px 5px rgba(75, 0, 130, 0.7)}90%{box-shadow:0 0 20px 5px rgba(238, 130, 238, 0.7)}}::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:#050505}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
</style>
