<svelte:head>
	<link rel="stylesheet" href="/styles/menu.css">
</svelte:head>

<script>
	import { trocarEstadoDoJogo } from './Estado.js'
</script>

<div class='menu' on:click={() => trocarEstadoDoJogo('menu')}>
	Voltar ao menu
</div>