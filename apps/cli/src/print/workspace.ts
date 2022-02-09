import chalk from "chalk"

const printWorkspace = (app: string, workspace: string | null): void => {
	if (!workspace) {
		console.log("No default workspace set.")
		console.log(
			`Use the ${chalk.black.bgYellow("uesio work")} command to set one.`
		)
		return
	}
	console.log(
		`Active workspace is ${chalk.green(workspace)} for app ${chalk.magenta(
			app
		)}.`
	)
}

export { printWorkspace }
