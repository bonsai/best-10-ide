import './app.css';
import App from './App.svelte';
import Wiki from './Wiki.svelte';

let app;

const targetApp = document.getElementById('app');
const targetWiki = document.getElementById('app-wiki');

if (targetApp) {
    app = new App({
        target: targetApp,
    });
} else if (targetWiki) {
    app = new Wiki({
        target: targetWiki,
    });
}

export default app;
