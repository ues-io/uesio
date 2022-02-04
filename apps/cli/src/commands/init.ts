import { Command, flags } from "@oclif/command"
import { prompt } from "enquirer"
const copy = require("copy-template-dir")
import path from "path"

export default class Init extends Command {
	static description = "Initialize a new uesio project"

	static flags = { name: flags.string({ char: "n" }) }
	static args = [{ name: "type" }]

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Init)

		if (typeof flags.name === "undefined") {
			const response = await prompt<{ name: string }>({
				type: "input",
				name: "name",
				message: "What is the folder name?",
			})
			flags.name = response.name
		}
		const name = flags.name

		const vars = { projectName: name }
		const inDir = path.resolve(__dirname, "../templates/v0.0.1")
		const outDir = path.join(process.cwd(), name)

		copy(inDir, outDir, vars, (err: Error, createdFiles: string[]) => {
			if (err) throw err
			createdFiles.forEach((filePath) =>
				console.log(`Created ${filePath}`)
			)
			console.log("done!")
		})
	}
}
