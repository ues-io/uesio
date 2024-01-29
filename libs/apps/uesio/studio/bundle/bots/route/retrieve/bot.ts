import { RouteBotApi } from "@uesio/bots"

type Params = {
	app: string
	version: string
}

export default function retrieve(bot: RouteBotApi) {
	function parseVersionStringToInt(
		version: string
	): [number, number, number, Error | null] {
		if (!version.startsWith("v")) {
			return [0, 0, 0, new Error("Invalid version string")]
		}

		version = version.substring(1)

		const parts = version.split(".")
		if (parts.length !== 3) {
			return [0, 0, 0, new Error("Invalid version string")]
		}

		const major = parseInt(parts[0])
		if (isNaN(major)) {
			return [0, 0, 0, new Error("Invalid version string")]
		}

		const minor = parseInt(parts[1])
		if (isNaN(minor)) {
			return [0, 0, 0, new Error("Invalid version string")]
		}

		const patch = parseInt(parts[2])
		if (isNaN(patch)) {
			return [0, 0, 0, new Error("Invalid version string")]
		}

		return [major, minor, patch, null]
	}

	const params = bot.params.getAll() as Params
	const [major, minor, patch, error] = parseVersionStringToInt(params.version)

	if (error != null) {
		bot.log.error("error", error.message)
		bot.response.setStatusCode(404)
		return
	}

	const results = bot.load({
		batchsize: 1,
		collection: "uesio/studio.bundle",
		fields: [
			{ id: "uesio/studio.contents" },
			{ id: "uesio/studio.description" },
		],
		conditions: [
			{
				field: "uesio/studio.app->uesio/core.uniquekey",
				operator: "EQ",
				value: params.app,
			},
			{
				field: "uesio/studio.major",
				operator: "EQ",
				value: major,
			},
			{
				field: "uesio/studio.minor",
				operator: "EQ",
				value: minor,
			},
			{
				field: "uesio/studio.patch",
				operator: "EQ",
				value: patch,
			},
		],
	})
	if (!results.length) {
		bot.response.setStatusCode(404)
		return
	}

	const result = results[0]
	bot.log.info("result", result)

	bot.response.setBody(
		{ test: result["uesio/studio.description"] },
		"application/json"
	)
	bot.response.setHeader("Content-Type", "application/json")

	// bot.response.setBody(result["uesio/studio.contents"], "application/zip")
	// bot.response.setHeader("Content-Type", "application/zip")
}
