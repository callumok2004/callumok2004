import { serve } from "bun"

async function getContainersStatus() {
	const p = Bun.spawn({
		cmd: ["docker", "ps", "-a", "--no-trunc", "--format", "{{json .}}"],
		stdout: "pipe",
		stderr: "pipe",
		env: process.env,
	})

	const stdoutText = await new Response(p.stdout).text()
	const stderrText = await new Response(p.stderr).text()

	console.log("Docker stdout:", stdoutText)
	console.log("Docker stderr:", stderrText)
	console.log("Exit code:", p.exitCode)

	if (p.exitCode !== 0 && p.exitCode !== null) {
		throw new Error(`Docker CLI error: ${stderrText || "Unknown error"}`)
	}

	if (!stdoutText.trim()) {
		return []
	}

	const lines = stdoutText.trim().split("\n")
	const containers = lines
		.map(line => {
			try {
				return JSON.parse(line)
			} catch {
				return null
			}
		})
		.filter((c): c is { State: string; CreatedAt: string } => c !== null)
		.sort((a, b) => new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime())

	return containers.map(c => (c.State.toLowerCase() === "exited" ? 0 : 1))
}

serve({
	port: 44773,
	async fetch(req) {
		if (new URL(req.url).pathname !== "/containers") {
			return new Response("Not found", { status: 404 })
		}

		try {
			const statuses = await getContainersStatus()
			return new Response(JSON.stringify(statuses), {
				headers: { "Content-Type": "application/json" },
			})
		} catch (e) {
			return new Response(`Error: ${e.message}`, { status: 500 })
		}
	},
})
