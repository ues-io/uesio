import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { runGenerator } from "../generate/generate"

const getKeyWithDefault = (
	fullName: string,
	defaultValue: string
): [string, string] => {
	const parts = fullName.split(".")
	if (parts.length === 2) {
		return [parts[0], parts[1]]
	}
	return [defaultValue, parts[0]]
}

export default class Generate extends Command {
	static description = "run a generator bot"

	static flags = {}

	static args = [{ name: "generator" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(Generate)

		const user = await authorize()
		const [namespace, name] = getKeyWithDefault(args.generator, "uesio")

		return runGenerator(namespace, name, user)
	}
}
