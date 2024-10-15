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
	<div class="">
		<svg width="86" height="80" viewBox="0 0 86 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M56.6542 45.4997C57.0579 46.9329 58.2997 47.9138 59.7006 47.977C60.6404 48.0191 61.5442 48.352 62.3637 48.8143L70.5389 53.4275L66.3389 60.7021L58.0394 52.6772L54.2146 53.7021C54.3739 51.0472 53.4826 48.4893 51.8151 46.5294C50.9489 47.4886 49.5044 47.7494 48.34 47.0771L49.7282 44.6726C49.5459 44.5505 35.1907 36.2523 35.1907 36.2523L36.5907 33.8274L15.2 21.4774L16.6 19.0526L51.9677 39.4721C54.2936 40.815 55.9488 42.9975 56.6542 45.4997Z"
				fill="black"
			/>
			<path
				d="M28.3223 45.2284L28.3223 45.2286C28.0318 46.2594 27.1504 46.9348 26.1932 46.978C25.049 47.0293 23.9913 47.4315 23.084 47.9432L23.0838 47.9433L14.9086 52.5566L14.0291 53.0529L14.534 53.9275L18.734 61.2021L19.3744 62.3113L20.2952 61.421L28.1876 53.7897L31.4656 54.668L32.8057 55.0271L32.7226 53.6422C32.5989 51.5818 33.1774 49.5857 34.3011 47.9424C35.4367 48.5972 36.8799 48.647 38.099 47.9431L38.965 47.4431L38.465 46.5771L37.5738 45.0335C37.9646 44.8063 38.4719 44.5119 39.0607 44.1705C40.4318 43.3756 42.243 42.3271 44.0487 41.2822C45.8544 40.2373 47.6544 39.1963 49.003 38.4164L50.6316 37.4748L51.0875 37.2112L51.2075 37.1418L51.2383 37.124L51.2461 37.1195L51.2481 37.1184L51.2485 37.1181C51.2487 37.118 51.2487 37.118 50.7482 36.2523L51.2487 37.118L52.114 36.6178L51.6143 35.7523L50.7143 34.1934L71.239 22.3434L72.105 21.8434L71.605 20.9774L70.205 18.5526L69.705 17.6865L68.839 18.1865L33.4713 38.6061C30.9155 40.0817 29.0971 42.4798 28.3223 45.2284Z"
				fill="black"
				stroke="white"
				stroke-width="2"
			/>
		</svg>
	</div>
	<h1>Screenshotgun</h1>
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
