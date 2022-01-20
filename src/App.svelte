<script>
	import Render from "./Render.svelte";
	import Footer from "./Footer.svelte";

	export let name;
</script>

<main>
	<h1>{name}</h1>

	<Render />
	<Footer />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		height: 100%;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>