import './app.css';
import App from './App.svelte';
import BBS from './BBS.svelte';

let app;

const targetApp = document.getElementById('app');
const targetBBS = document.getElementById('app-bbs');

if (targetApp) {
    app = new App({
        target: targetApp,
    });
} else if (targetBBS) {
    app = new BBS({
        target: targetBBS,
    });
}

export default app;
