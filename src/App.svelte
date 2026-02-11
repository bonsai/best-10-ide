<script>
  import { onMount } from 'svelte';
  import page from 'page';
  import Home from './Home.svelte'; // Assuming your original content is in Home.svelte
  import BBS from './BBS.svelte';

  let currentComponent = Home; // Default component

  onMount(() => {
    page('/', () => {
      currentComponent = Home;
    });

    page('/bbs', () => {
      currentComponent = BBS;
    });

    page.start();
  });
</script>

<svelte:component this={currentComponent} />
