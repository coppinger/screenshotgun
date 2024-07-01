<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	let url = '';
	let maxHeight = 4000;
	let sections = [];
	let isLoading = false;
	let error = null;
	let debugInfo = '';

	// Get the domain name from the URL
	$: domainName = url ? new URL(url).hostname.replace(/^www\./, '') : '';

	onMount(() => {
		if ($page.data.screenshot) {
			processScreenshot($page.data.screenshot);
		}
	});

	$: if (browser && $page.data.screenshot) {
		processScreenshot($page.data.screenshot);
	}

	async function captureScreenshot() {
		isLoading = true;
		error = null;
		sections = [];

		try {
			console.log(`Starting capture for URL: ${url}`);
			await goto(`?url=${encodeURIComponent(url)}`, { keepfocus: true, replaceState: true });

			// Access the new data from the updated $page store
			const result = $page.data;
			console.log('Server response:', result);

			if (result.error) {
				throw new Error(result.error);
			}

			if (!result.screenshot) {
				throw new Error('No screenshot URL received from the server');
			}

			console.log(`Screenshot URL received: ${result.screenshot}`);
			await processScreenshot(result.screenshot);
		} catch (err) {
			error = err.message || 'Failed to capture screenshot. Please try again.';
			console.error('Detailed error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function processScreenshot(screenshotDataUrl) {
		try {
			console.log(`Processing screenshot from data URL`);
			const img = new Image();
			img.src = screenshotDataUrl;

			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
			});

			console.log(`Image loaded, dimensions: ${img.width}x${img.height}`);

			// Clear the existing sections array
			sections = [];

			// Split the image into sections
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			let currentHeight = 0;

			while (currentHeight < img.height) {
				canvas.width = img.width;
				canvas.height = Math.min(maxHeight, img.height - currentHeight);

				ctx.drawImage(
					img,
					0,
					currentHeight,
					img.width,
					canvas.height,
					0,
					0,
					canvas.width,
					canvas.height
				);
				const dataUrl = canvas.toDataURL('image/png');
				sections.push(dataUrl);

				currentHeight += canvas.height;
			}

			console.log(`Created ${sections.length} sections`);
		} catch (err) {
			error = 'Failed to process screenshot. Please try again.';
			console.error('Screenshot processing error:', err);
		}
	}

	function downloadSection(dataUrl, index) {
		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = `${domainName}_section_${index + 1}.png`;
		link.click();
	}

	function downloadAllSections() {
		sections.forEach((section, index) => {
			const link = document.createElement('a');
			link.href = section;
			link.download = `${domainName}_section_${index + 1}.png`;
			link.click();
		});
	}
</script>

<main>
	<h1>Website Screenshot Tool</h1>
	<div>
		<button on:click={downloadAllSections}>Download All Sections as Images</button>
	</div>

	<div>
		<input bind:value={url} placeholder="Enter website URL" />
		<input type="number" bind:value={maxHeight} placeholder="Max height (px)" />
		<button on:click={captureScreenshot} disabled={isLoading}>
			{isLoading ? 'Capturing...' : 'Capture Screenshot'}
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if sections.length > 0}
		<h2>Screenshot Sections: {sections.length}</h2>
		{#each sections as section, i}
			<div class="section">
				<img src={section} alt={`Section ${i + 1}`} />
				<button on:click={() => downloadSection(section, i)}>Download Section {i + 1}</button>
			</div>
		{/each}
	{/if}

	<pre>{debugInfo}</pre>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}
	.error {
		color: red;
	}
	.section {
		margin-bottom: 20px;
	}
	img {
		max-width: 100%;
		height: auto;
	}
</style>
