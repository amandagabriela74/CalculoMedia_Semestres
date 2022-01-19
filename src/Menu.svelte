<svelte:head>
	<link rel="stylesheet" href="/styles/menu.css">
</svelte:head>

<script>
	import { estado } from './Estado.js'
	import { trocarEstadoDoJogo } from './Estado.js'
</script>

<h1>
	Média Final
</h1>

<br><br>

<div class='menu' on:click={() => trocarEstadoDoJogo('media')}>
	Calcular a Média
</div>

<div class='menu' on:click={() => trocarEstadoDoJogo('sobre')}>
	Sobre
</div>
