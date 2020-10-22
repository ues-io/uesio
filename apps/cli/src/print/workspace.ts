import chalk = require("chalk")

const printWorkspace = (workspace: string, app: string): void => {
	console.log(
		`Active workspace set to ${chalk.green(
			workspace
		)} for app ${chalk.magenta(app)}.`
	)
}

export { printWorkspace }
