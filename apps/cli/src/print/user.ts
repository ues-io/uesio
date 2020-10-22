import chalk = require("chalk")
import { User } from "../auth/login"

const printUser = (user: User): void => {
	console.log(
		`Hello! ${chalk.magenta(user.firstname)} ${chalk.magenta(
			user.lastname
		)}`
	)
	console.log(
		`You are a ${chalk.green(user.profile)} user in the ${chalk.green(
			user.site
		)} site.`
	)
}

export { printUser }
