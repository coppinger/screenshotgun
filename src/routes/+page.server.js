import { SCREENSHOT_API_KEY } from '$env/static/private';
import axios from 'axios';

export async function load({ url }) {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) return { screenshot: null };

	try {
		console.log('Attempting to capture screenshot for:', targetUrl);
		const response = await axios.get(`https://api.screenshotone.com/take`, {
			params: {
				access_key: SCREENSHOT_API_KEY, // Replace with your ScreenshotOne access key
				url: targetUrl,
				full_page: true,
				full_page_scroll: true,
				full_page_scroll_delay: 2000,
				full_page_scroll_by: 600,
				viewport_width: 1920,
				viewport_height: 1080,
				device_scale_factor: 1,
				format: 'jpg',
				image_quality: 80,
				block_ads: true,
				block_cookie_banners: true,
				block_banners_by_heuristics: false,
				block_trackers: true,
				delay: 5,
				timeout: 90,
				reduced_motion: true,
				dark_mode: true
			},
			validateStatus: false,
			responseType: 'arraybuffer' // Expect binary data
		});

		console.log('API Response Status:', response.status);

		if (response.status !== 200) {
			console.error('API Error:', response.status, response.data);
			return { error: `API Error: ${response.status} - ${response.statusText}` };
		}

		if (!response.data) {
			console.error('No screenshot data in the API response');
			return { error: 'No screenshot data in the API response' };
		}

		// Convert the binary data to a base64-encoded data URL
		const base64 = Buffer.from(response.data, 'binary').toString('base64');
		const dataUrl = `data:image/jpg;base64,${base64}`;

		console.log('Returning screenshot as data URL');
		return { screenshot: dataUrl };
	} catch (error) {
		console.error('Screenshot API error:', error.message);
		return { error: 'Failed to capture screenshot: ' + error.message };
	}
}
