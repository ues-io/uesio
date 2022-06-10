import chalk from "chalk"

const printHost = (hostUrl: string): void => {
	console.log(`Connected to host: ${chalk.cyan(hostUrl)} `)
}

export { printHost }
