<script>
	import Menu from "./Menu.svelte";
	import Media from "./Media.svelte";
	import Sobre from "./Sobre.svelte";

	import { estado } from './Estado.js'
</script>


<!-- o jogo tem três estados menu, jogar e sobre, cada um representa uma tela diferente para o usuário -->
{#if $estado === 'menu'}
	<!-- notem como cada componente/módulo que crianos no svelte vira um tag -->
	<Menu/>
{:else if $estado === 'media'}
	<Media/>
{:else if $estado === 'sobre'}
	<Sobre/>
{/if}

