const fs = require('fs/promises');
const crypto = require('crypto');

const USERNAME = 'CounterStrike';
const WEBHOOK_URL = '';
const STATE_FILE = 'state.json';
const INTERVAL = 10000;

const IGNORE_FIELDS = new Set(['banner_url', 'followers']);

const LIKES_DEBOUNCE_POLLS = 10;

const CUSTOM_HANDLERS = {};

let state = {}

async function buildFollowingEmbeds(oldList, newList) {
	const oldSet = new Set(oldList.map(u => u.screen_name));
	const newSet = new Set(newList.map(u => u.screen_name));

	const followed = newList.filter(u => !oldSet.has(u.screen_name));
	const unfollowed = oldList.filter(u => !newSet.has(u.screen_name));

	const embeds = [];

	if (followed.length) {
		const count = followed.length;
		embeds.push({
			description: `Followed ${count} account${count !== 1 ? 's' : ''}\n${followed.map(u => `[@${u.screen_name}](https://x.com/${u.screen_name})`).join('\n')}`,
			url: `https://x.com/${USERNAME}/following`,
			color: 0x00b06c
		});
	}

	if (unfollowed.length) {
		const count = unfollowed.length;
		embeds.push({
			description: `Unfollowed ${count} account${count !== 1 ? 's' : ''}\n${unfollowed.map(u => `[@${u.screen_name}](https://x.com/${u.screen_name})`).join('\n')}`,
			url: `https://x.com/${USERNAME}/following`,
			color: 0xff4444
		});
	}

	return embeds;
}

function flattenObject(obj, prefix = '') {
	const result = {};
	for (const [key, val] of Object.entries(obj ?? {})) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (IGNORE_FIELDS.has(path)) continue;
		if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
			Object.assign(result, flattenObject(val, path));
		} else {
			result[path] = String(val ?? '');
		}
	}
	return result;
}

async function getUserData() {
	try {
		const res = await fetch(`https://api.fxtwitter.com/${USERNAME}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data?.user || null;
	} catch {
		return null;
	}
}

async function getFollowingList() {
	try {
		const results = [];
		let cursor = null;

		while (true) {
			const url = new URL(`https://api.fxtwitter.com/2/profile/${USERNAME}/following`);
			url.searchParams.set('count', '100');
			if (cursor) url.searchParams.set('cursor', cursor);

			const res = await fetch(url);
			if (!res.ok) return null;
			const data = await res.json();

			if (!data.results?.length) break;
			results.push(...data.results.map(u => ({ id: u.id, screen_name: u.screen_name })));

			if (!data.cursor?.bottom) break;
			cursor = data.cursor.bottom;
		}

		return results;
	} catch {
		return null;
	}
}
async function getLatestTweets() {
	try {
		const res = await fetch(`https://api.fxtwitter.com/2/profile/${USERNAME}/statuses`);
		if (!res.ok) return null;
		const data = await res.json();
		return data?.results ?? null;
	} catch {
		return null;
	}
}

async function sendTweetUrl(url) {
	if (!WEBHOOK_URL.startsWith('http')) return;
	await fetch(WEBHOOK_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ content: `${url}` })
	}).catch(() => console.log('webhook failed'));
}

async function getImageHash(url) {
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const buffer = Buffer.from(await res.arrayBuffer());
		return crypto.createHash('sha256').update(buffer).digest('hex');
	} catch {
		return null;
	}
}

async function sendEmbeds(embeds) {
	if (!WEBHOOK_URL.startsWith('http')) return;
	for (let i = 0; i < embeds.length; i += 10) {
		await fetch(WEBHOOK_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				embeds: embeds.slice(i, i + 10)
			})
		}).catch(() => console.log("webhook failed"));
	}
}

async function check() {
	const user = await getUserData();
	if (!user) return;

	if (!user.likes || !user.tweets || !user.following || !user.description || !user.website?.url) {
		console.log('[safeguard] core fields missing/null/0 — skipping response');
		return;
	}

	const bannerUrl = user.banner_url || null;
	const bannerHash = bannerUrl ? await getImageHash(bannerUrl) : null;
	const flat = flattenObject(user);

	let saved = null;
	try {
		saved = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
		state = saved;
	} catch { }

	if (!saved) {
		console.log('Initializing — fetching following list and latest tweet...');
		const followingList = await getFollowingList() ?? [];
		const tweets = await getLatestTweets();
		const latestTweetId = tweets?.[0]?.id ?? null;
		const initLikes = parseInt(flat.likes);
		await fs.writeFile(STATE_FILE, JSON.stringify({
			fields: flat, bannerHash, bannerUrl, followingList, latestTweetId,
			confirmedLikes: Number.isFinite(initLikes) ? initLikes : null,
			candidateLikes: Number.isFinite(initLikes) ? initLikes : null,
			likeStreak: 0
		}));
		console.log('Initialized');
		return;
	}

	const changes = [];
	const allKeys = new Set([...Object.keys(flat), ...Object.keys(saved.fields ?? {})]);

	for (const key of allKeys) {
		const current = flat[key] ?? '';
		const previous = saved.fields?.[key] ?? '';
		if (current !== previous) changes.push({ field: key, from: previous, to: current });
	}

	if (changes.length > 7) {
		console.log('Too many changes? api fucked up again? skipping...');
		return;
	}

	const bannerChanged = bannerHash && saved.bannerHash && bannerHash !== saved.bannerHash;

	const embeds = [];
	const defaultChanges = [];

	for (const { field, from, to } of changes) {
		const handler = CUSTOM_HANDLERS[field];
		if (handler) {
			const embed = await handler(from, to);
			if (embed) {
				embed.author = {
					name: "Counter Strike",
					icon_url: state.fields?.['avatar_url'],
					url: "https://x.com/CounterStrike"
				}
				embeds.push(embed);
				continue;
			}
		}
		if (field !== 'tweets' && field !== 'likes') defaultChanges.push({ field, from, to });
	}

	if (defaultChanges.length > 0 || bannerChanged) {
		const lines = defaultChanges
		.filter(c => c.to)
		.map(({ field, from, to }) => {
			if (!from) from = 'null';
			if (!to) to = 'null';
			return `**${field}**: \`${from}\` → \`${to}\``;
		});
		if (bannerChanged) lines.push(`**banner**: [view new banner](${bannerUrl})`);

		embeds.push({
			author: {
				name: "Counter Strike",
				icon_url: state.fields?.['avatar_url'],
				url: "https://x.com/CounterStrike"
			},
			description: lines.join('\n'),
			url: `https://x.com/${USERNAME}`,
			...(bannerChanged ? { image: { url: bannerUrl } } : {}),
			color: 3447003
		});
	}

	const savedLikesField = parseInt(saved.fields?.likes);
	let confirmedLikes = saved.confirmedLikes ?? (Number.isFinite(savedLikesField) ? savedLikesField : null);
	let candidateLikes = saved.candidateLikes ?? confirmedLikes;
	let likeStreak = saved.likeStreak ?? 0;

	const rawLikes = parseInt(flat.likes);
	if (Number.isFinite(rawLikes)) {
		if (rawLikes === candidateLikes) {
			likeStreak++;
		} else {
			candidateLikes = rawLikes;
			likeStreak = 1;
		}

		if (likeStreak >= LIKES_DEBOUNCE_POLLS && confirmedLikes !== null && candidateLikes !== confirmedLikes) {
			const diff = candidateLikes - confirmedLikes;
			const count = Math.abs(diff);
			embeds.push({
				author: {
					name: "Counter Strike",
					icon_url: state.fields?.['avatar_url'],
					url: "https://x.com/CounterStrike"
				},
				description: diff > 0
					? `❤️ Liked ${count} tweet${count !== 1 ? 's' : ''}`
					: `💔 Unliked ${count} tweet${count !== 1 ? 's' : ''}`,
				url: `https://x.com/${USERNAME}/likes`,
				color: diff > 0 ? 0xe0245e : 0x888888
			});
			confirmedLikes = candidateLikes;
		}
	}

	const followingChanged = changes.some(c => c.field === 'following');
	let newFollowingList = saved.followingList ?? [];

	if (followingChanged) {
		console.log('Following count changed — fetching list...');
		const fetched = await getFollowingList();
		if (fetched) {
			const followEmbeds = await buildFollowingEmbeds(saved.followingList ?? [], fetched);
			embeds.push(...followEmbeds);
			newFollowingList = fetched;
		}
	}

	const tweetsChanged = changes.some(c => c.field === 'tweets');
	let latestTweetId = saved.latestTweetId ?? null;

	if (tweetsChanged) {
		console.log('Tweet count changed — fetching latest tweets...');
		const tweets = await getLatestTweets();
		if (tweets?.length) {
			const newTweets = latestTweetId
				? tweets.filter(t => BigInt(t.id) > BigInt(latestTweetId))
				: tweets.slice(0, 1);
			if (newTweets.length > 0) {
				console.log(`${newTweets.length} new tweet(s) detected`);
				for (const tweet of newTweets.reverse()) {
					await sendTweetUrl(`https://fxtwitter.com/${USERNAME}/status/${tweet.id}`);
				}
			}
			latestTweetId = tweets[0].id;
		}
	}

	if (embeds.length > 0) {
		console.log('Changes detected, sending...');
		await sendEmbeds(embeds);
	}

	const likesStateChanged =
		confirmedLikes !== (saved.confirmedLikes ?? null) ||
		candidateLikes !== (saved.candidateLikes ?? null) ||
		likeStreak !== (saved.likeStreak ?? 0);

	if (changes.length > 0 || bannerChanged || followingChanged || latestTweetId !== saved.latestTweetId || likesStateChanged) {
		await fs.writeFile(STATE_FILE, JSON.stringify({
			fields: flat,
			bannerHash: bannerHash ?? saved.bannerHash,
			bannerUrl: bannerUrl ?? saved.bannerUrl,
			followingList: newFollowingList,
			latestTweetId,
			confirmedLikes,
			candidateLikes,
			likeStreak
		}));
	}
}

setInterval(check, INTERVAL);
check();
