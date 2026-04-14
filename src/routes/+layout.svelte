<script lang="ts">
	let { children } = $props();
</script>

<div class="app">
	<main>{@render children()}</main>
</div>

<style>
	.app {
		min-height: 100vh;
		width: 100%;
	}

	main {
		width: 100%;
		height: 100vh;
	}
</style>
