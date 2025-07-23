import midi, { Input, Output } from "easymidi"
import axios from "axios"

const DeviceName = "Launchpad Mini"
const RetryInterval = 1000

let input: Input | null = null
let output: Output | null = null
let connectedName: string | null = null
let httpInterval: NodeJS.Timeout | null = null

const validNotes: number[] = []
const IdToNote: Record<number, number> = {}
const noteStates: Record<number, number> = {}

let id = 0;
for (let row = 0; row < 8; row++) {
	for (let col = 0; col < 9; col++) {
		id++;
		validNotes.push(row * 16 + col)
		IdToNote[id] = row * 16 + col;
		noteStates[id] = -1;
	}
}

console.log(`Valid notes: ${validNotes.join(", ")}`)

const NOTE_ON = 120;
const NOTE_IDLE = 50;
const NOTE_OFF = 10;

let count_offline = 0;

let state = false;
setInterval(() => {
	if (!input) return;
	console.log(`Count offline: ${count_offline}, State: ${state}`)
	if (count_offline == 0 && !state) return;

	state = !state;

	const notes = validNotes.slice(-27);

	for (const i of notes) {
		output?.send("noteon", {
			note: i,
			velocity: state ? NOTE_OFF : NOTE_IDLE,
			channel: 0 as const
		});
	}
}, 500);

async function onMidiConnected(name: string, input: Input, output: Output): Promise<void> {
	console.log(`MIDI device connected: ${name}`)

	let delay = .1;
	for (const i of validNotes) {
		setTimeout(() => {
			output.send("noteon", {
				note: i,
				velocity: NOTE_IDLE,
				channel: 0 as const
			})
		}, delay * 1000);
		delay += .01;
	}

	if (httpInterval) clearInterval(httpInterval);

	httpInterval = setInterval(async () => {
		const res = await axios.get("http://192.168.1.169:44773/containers").catch(err => {
			console.error("Failed to fetch containers:", err);
			return { data: [] };
		});

		const containers = res.data;
		if (!Array.isArray(containers)) {
			console.error("Invalid response from server:", res.data);
			return;
		}

		console.log(`Fetched ${containers.length} containers`);
		count_offline = 0;

		for (let i = 0; i < containers.length; i++) {
			const noteId = i + 1;
			const note = IdToNote[noteId];
			const state = containers[i] || 0;

			if (state === 0) {
				console.log(`Container ${noteId} is offline`);
				count_offline++;
			}

			if (noteStates[noteId] !== state) {
				noteStates[noteId] = state;
				output.send("noteon", {
					note: note,
					velocity: state == 1 ? NOTE_ON : NOTE_OFF,
					channel: 0 as const
				});
			}
		}

	}, 1000);
}

async function main(): Promise<void> {
	while (true) {
		const inputDevices = midi.getInputs()
		const outputDevices = midi.getOutputs()

		const match = inputDevices.find(name => name.includes(DeviceName))
		const outMatch = outputDevices.find(name => name.includes(DeviceName))

		if (match && outMatch && !input && !output) {
			try {
				input = new midi.Input(match)
				output = new midi.Output(outMatch)
				connectedName = match
				await onMidiConnected(match, input, output)
			} catch (e) {
				console.error(`Failed to connect: ${(e as Error).message}`)
				input = null
				output = null
				connectedName = null
			}
		}

		if ((!match || !outMatch) && (input || output)) {
			console.log(`MIDI device disconnected: ${connectedName}`)
			if (httpInterval) clearInterval(httpInterval);
			input?.close()
			output?.close()
			input = null
			output = null
			connectedName = null
		}

		await new Promise(resolve => setTimeout(resolve, RetryInterval))
	}
}

main().catch(error => {
	console.error(`Fatal error: ${error instanceof Error ? error.message : error}`)
})
