import { post } from "../request/request"
import { getApp, getVersion } from "../config/config"
import { User } from "../auth/login"
import unzipper from "unzipper"
import { getAnswers } from "./prompts"

const runGenerator = async (namespace: string, name: string, user: User) => {
	const version = await getVersion(namespace)
	const app = await getApp()

	const answers = await getAnswers(app, version, namespace, name, user)

	const response = await post(
		`version/${app}/${namespace}/${version}/metadata/generate/${name}`,
		JSON.stringify(answers),
		user.cookie
	)

	if (!response || !response.body) throw new Error("invalid response")

	response.body
		.pipe(
			unzipper.Extract({
				path: "bundle",
			})
		)
		.on("close", () => {
			console.log("New bundle extracted!")
		})
}

export { runGenerator }
