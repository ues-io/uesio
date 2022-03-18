import { fileExists, getApp } from "../config/config"
import * as path from "path"
import { promises as fs } from "fs"
import * as yaml from "yaml"
import chalk from "chalk"

import webpack, { RuleSetRule, StatsError } from "webpack"

type ComponentMap = {
	[key: string]: unknown
}

type EntryFileMap = {
	[key: string]: string
}

interface WebpackError extends Error {
	details?: string
}

const factory = ['import { component } from "@uesio/ui";']

const getEntryFile = async (
	bundleName: string,
	components: ComponentMap,
	utilityComponents: ComponentMap
): Promise<string> => {
	// Create Runtime Entrypoint
	const imports = []
	const registrations = []

	for (const key in components) {
		const [, name] = key.split(".")
		const hasDefinition = await fileExists(
			path.resolve(`./bundle/components/view/${key}/${name}.tsx`)
		)
		if (hasDefinition) {
			const hasSignals = await fileExists(
				path.resolve(`./bundle/components/view/${key}/signals.ts`)
			)
			imports.push(
				`import ${name} from "../../components/view/${key}/${name}";`
			)

			if (hasSignals) {
				imports.push(
					`import ${name}signals from "../../components/view/${key}/signals";`
				)
			}
			registrations.push(
				`component.registry.register("${key}", ${name}${
					hasSignals ? `, ${name}signals` : ""
				});`
			)
		}
	}

	for (const key in utilityComponents) {
		const [, name] = key.split(".")
		const hasDefinition = await fileExists(
			path.resolve(`./bundle/components/utility/${key}/${name}.tsx`)
		)
		if (hasDefinition) {
			imports.push(
				`import ${name}_utility from "../../components/utility/${key}/${name}";`
			)

			registrations.push(
				`component.registry.registerUtilityComponent("${key}", ${name}_utility);`
			)
		}
	}

	return factory.concat(imports, registrations).join("\n")
}

const getBuilderEntryFile = async (
	bundleName: string,
	components: ComponentMap
): Promise<string> => {
	// Create Buildtime Entrypoint
	const builderImports = []
	const defImports = []
	const builderRegistrations = []

	for (const key in components) {
		const [, name] = key.split(".")
		const builderName = `${name}builder`
		const propDefName = `${name}definition`

		const hasBuilder = await fileExists(
			path.resolve(`./bundle/components/view/${key}/${builderName}.tsx`)
		)

		if (hasBuilder) {
			builderImports.push(
				`import ${builderName} from "../../components/view/${key}/${builderName}";`
			)
		}

		const hasDef = await fileExists(
			path.resolve(`./bundle/components/view/${key}/${propDefName}.ts`)
		)

		if (hasDef) {
			defImports.push(
				`import ${propDefName} from "../../components/view/${key}/${propDefName}";`
			)
		}

		if (hasDef || hasBuilder) {
			builderRegistrations.push(
				`component.registry.registerBuilder("${key}", ${
					hasBuilder ? builderName : "undefined"
				}, ${hasDef ? propDefName : "undefined"});`
			)
		}
	}

	return factory
		.concat(builderImports, defImports, builderRegistrations)
		.join("\n")
}

const createEntryFiles = async (): Promise<EntryFileMap> => {
	// Get the bundle name
	const appName = await getApp()

	const packDir = "./bundle/componentpacks"
	const entries: EntryFileMap = {}

	const files = await fs.readdir(path.resolve(packDir)).catch(() => [])

	for (const dirname of files) {
		// Filter out .DS_Store and other hidden files
		if (dirname.startsWith(".")) continue
		const contents = await fs.readFile(
			path.resolve(packDir, dirname, "pack.yaml"),
			"utf8"
		)
		const yamlContents = yaml.parse(contents)
		const packName = yamlContents.name as string
		const components = yamlContents.components
		const viewComponents = components.view
		const utilityComponents = components.utility
		const fullPackName = `${appName}.${packName}`
		entries[fullPackName + "/runtime"] = path.resolve(
			`./bundle/componentpacks/${fullPackName}/runtime.entry.ts`
		)
		entries[fullPackName + "/builder"] = path.resolve(
			`./bundle/componentpacks/${fullPackName}/builder.entry.ts`
		)

		await fs.writeFile(
			path.resolve(packDir, `${fullPackName}/runtime.entry.ts`),
			await getEntryFile(appName, viewComponents, utilityComponents)
		)

		await fs.writeFile(
			path.resolve(packDir, `${fullPackName}/builder.entry.ts`),
			await getBuilderEntryFile(appName, viewComponents)
		)
	}

	return entries
}
interface Flags {
	develop: boolean
	stats: boolean
}

const getWebpackConfig = (
	entries: EntryFileMap,
	flags: Flags
): webpack.Configuration => {
	const dev = flags.develop
	const devRule: RuleSetRule = {
		enforce: "pre",
		test: /\.js$/,
		loader: require.resolve("source-map-loader"),
	}
	return {
		// Configuration Object
		resolve: {
			// Add '.ts' and '.tsx' as resolvable extensions.
			extensions: [".ts", ".tsx", ".js"],
			alias: {
				"@uesio/loginhelpers": path.resolve("../../loginhelpers/src"),
			},
		},
		module: {
			rules: [
				{
					test: /\.ts(x?)$/,
					exclude: /node_modules/,
					use: [
						{
							loader: require.resolve("ts-loader"),
							options: {
								silent: true,
								errorFormatter: (error: StatsError) =>
									error.content,
							},
						},
					],
				},
				...(dev ? [devRule] : []),
			],
		},
		...(dev
			? {
					watch: true,
					devtool: "inline-source-map",
					watchOptions: {
						ignored: /node_modules/,
					},
			  }
			: {}),
		mode: dev ? "development" : "production",
		entry: entries,
		output: {
			path: path.resolve("./bundle/componentpacks"),
			filename: "[name].bundle.js",
		},
		node: false,
		externals: {
			react: "React",
			"react-dom": "ReactDOM",
			"@uesio/ui": "uesio",
			yaml: "yaml",
			"@emotion/css": "emotion",
		},
	}
}

const handleErrors = (errors: webpack.StatsError[]) => {
	// Try to print errors nicely and just print everything if it fails
	try {
		// Group errors by file
		const perFile = errors.reduce(
			(acc: Record<string, webpack.StatsError[]>, error) => {
				if (!error) return acc
				if (error.file) {
					const pathArray = error.file.split("/")
					const path = pathArray.splice(-4).join("/")
					return {
						...acc,
						[path]: [...(path in acc ? acc[path] : []), error],
					}
				}

				const path = "NOFILE"
				return {
					...acc,
					[path]: [...(path in acc ? acc[path] : []), error],
				}
			},
			{}
		)

		Object.keys(perFile).forEach((file) => {
			// File
			const pathArray = perFile[file][0].file?.split("/") || []
			const path = pathArray.splice(-4).join("/")
			const namespace = pathArray[pathArray.indexOf("apps") + 1] || "none"
			console.log(
				chalk`{bold.bgRed  E R R O R } {bold.bgBlue  ${namespace.toUpperCase()} } ${path} `
			)
			console.log(``)

			perFile[file].forEach((error) => {
				// Individual error
				if (!error.loc) return
				console.log(
					chalk`> {bold Line: ${
						error.loc.split(":")[0]
					}} {bold.redBright ${error.message}}`
				)
				console.log(``)
			})
			console.log(``)
		})
	} catch (fail) {
		console.log(`Error while processing webpack errors: ${fail}`)
		console.log(errors)
	}
}

const getWebpackComplete = (
	flags: Flags
): ((err: WebpackError, stats: webpack.Stats) => void) => {
	const dev = flags.develop
	const getStats = flags.stats
	let firstMessage = true
	let firstRebuild = true
	return (err: WebpackError, stats: webpack.Stats): void => {
		// Stats Object
		if (err) {
			console.error(err.stack || err)
			if (err.details) {
				console.error(err.details)
			}
			return
		}

		const info = stats.toJson()

		if (getStats) {
			fs.writeFile("stats.json", JSON.stringify(info))
		}

		if (stats.hasErrors()) {
			// Left this here in case we want to use standardized errors again
			// info.errors?.forEach((message) => console.error(message))

			if (info.errors) handleErrors(info.errors)

			// force the build process to fail upon compilation error, except for the watcher on dev mode
			if (!dev) {
				process.exit(1)
			}
		}
		if (!stats.hasErrors()) {
			console.log(chalk`{greenBright No errors :) }`)
		}
		if (stats.hasWarnings()) {
			info.warnings?.forEach((message) => console.warn(message))
		}
		if (dev) {
			if (firstMessage) {
				console.log("Done PACKING!")
				firstMessage = false
			} else {
				//There does not seem to be a way in webpack API to detect this initial compilation
				//completed from a watch command - so we have this hacky workaround
				if (firstRebuild) {
					console.log("Watching Pack...")
					firstRebuild = false
				} else {
					console.log("Rebuilt pack")
				}
			}
		} else {
			console.log("Done PACKING!")
		}
		// Done processing
	}
}

export { createEntryFiles, getWebpackConfig, getWebpackComplete }
