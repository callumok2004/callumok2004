import fs from 'fs'
import { exec } from 'child_process'
import path from 'path'

const ServicesConfig = 'services.json'
const ServicesRoot = './services/'

interface Service {
	name: string
	command: string
}

const Config = JSON.parse(fs.readFileSync(ServicesConfig, 'utf8'))
const Services = Config as Service[]

function fileExists(filePath: string) {
	try {
		return fs.existsSync(filePath)
	} catch {
		return false
	}
}

function StartDockerContainer(service: Service) {
	const name = `service-${service.name}`
	const nameLower = name.toLowerCase()
	const workdir = path.resolve(`${ServicesRoot}${service.name}`)
	const dockerfilePath = path.join(workdir, 'Dockerfile')

	let command = ''
	if (fileExists(dockerfilePath)) {
		command = `docker build -t ${nameLower}-image ${workdir} && docker run -d --name ${name} ${nameLower}-image ${service.command}`
	} else {
		command = `docker run -d --rm --name ${name} -v ${workdir}:/app -w /app ${service.command}`
	}

	console.log(`Starting container for ${service.name} with command: ${service.command}`)

	return new Promise((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) {
				console.error(`Error starting container for ${service.name}: ${err}`)
				reject(err)
			} else {
				console.log(`Started container for ${service.name}`)
				resolve(stdout)
			}
		})
	})
}

function RemoveServiceContainers() {
	console.log('Removing all service containers')

	const command = `docker ps -a --filter "name=service-" --format "{{.Names}}" | xargs -r docker rm -f`

	return new Promise((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) {
				console.error(`Error removing service containers: ${err}`)
				reject(err)
			} else {
				console.log('Removed all service containers')
				resolve(stdout)
			}
		})
	})
}

await RemoveServiceContainers()
await Promise.all(Services.map(StartDockerContainer))
