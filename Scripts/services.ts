import fs from 'fs'
import { exec } from 'child_process'
import path from 'path'

const ServicesConfig = 'services.json'
const ServicesRoot = './services/'

interface Service {
	name: string
	command: string
}

const args = process.argv.slice(2)
const nameArgIndex = args.indexOf('--name')
const selectedServiceName = nameArgIndex !== -1 ? args[nameArgIndex + 1] : null

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

function RemoveServiceContainer(serviceName: string) {
	const name = `service-${serviceName}`

	console.log(`Removing container ${name}`)

	const command = `docker rm -f ${name}`

	return new Promise((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) {
				console.error(`Error removing container ${name}: ${err}`)
				resolve(null)
			} else {
				console.log(`Removed container ${name}`)
				resolve(stdout)
			}
		})
	})
}

if (selectedServiceName) {
	const service = Services.find(s => s.name === selectedServiceName)
	if (!service) {
		console.error(`Service "${selectedServiceName}" not found in ${ServicesConfig}`)
		process.exit(1)
	}
	await RemoveServiceContainer(service.name)
	await StartDockerContainer(service)
} else {
	await Promise.all(Services.map(s => RemoveServiceContainer(s.name)))
	await Promise.all(Services.map(StartDockerContainer))
}
