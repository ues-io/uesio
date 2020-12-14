import { fileExists, getApp } from "../config/config"
import * as path from "path"
import { promises as fs } from "fs"
import * as yaml from "yaml"
import webpack = require("webpack")
import { RuleSetRule } from "webpack"

type ComponentMap = {
	[key: string]: unknown
}

type EntryFileMap = {
	[key: string]: string
}

const factory = ['import { component } from "@uesio/ui";']

const getEntryFile = async (
	bundleName: string,
	components: ComponentMap
): Promise<string> => {
	// Create Runtime Entrypoint
	const imports = []
	const registrations = []

	for (const name in components) {
		const hasDefinition = await fileExists(
			path.resolve(`./bundle/components/${name}/${name}.tsx`)
		)
		if (hasDefinition) {
			const hasSignals = await fileExists(
				path.resolve(`./bundle/components/${name}/signals.ts`)
			)
			imports.push(`import ${name} from "../components/${name}/${name}";`)

			if (hasSignals) {
				imports.push(
					`import ${name}signals from "../components/${name}/signals";`
				)
			}
			registrations.push(
				`component.registry.register("${bundleName}", "${name}", ${name}${
					hasSignals ? `, ${name}signals` : ""
				});`
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

	for (const name in components) {
		const builderName = `${name}builder`
		const propDefName = `${name}definition`
		const hasBuilder = await fileExists(
			path.resolve(`./bundle/components/${name}/${builderName}.tsx`)
		)

		if (hasBuilder) {
			const hasDef = await fileExists(
				path.resolve(`./bundle/components/${name}/${propDefName}.ts`)
			)

			builderImports.push(
				`import ${builderName} from "../components/${name}/${builderName}";`
			)

			if (hasDef) {
				defImports.push(
					`import ${propDefName} from "../components/${name}/${propDefName}";`
				)
			}

			builderRegistrations.push(
				`component.registry.registerBuilder("${bundleName}", "${name}", ${builderName}, ${
					hasDef ? propDefName : "null"
				});`
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

	const packs = files.filter((filename) => filename.endsWith(".yaml"))

	for (const filename of packs) {
		const contents = await fs.readFile(
			path.resolve(packDir, filename),
			"utf8"
		)
		const yamlContents = yaml.parse(contents)
		const packName = yamlContents.name as string
		const components = yamlContents.components
		const fullPackName = `${appName}.${packName}`
		entries[fullPackName] = path.resolve(
			`./bundle/componentpacks/${fullPackName}.entry.ts`
		)
		entries[fullPackName + ".builder"] = path.resolve(
			`./bundle/componentpacks/${fullPackName}.builder.entry.ts`
		)

		await fs.writeFile(
			path.resolve(packDir, `${fullPackName}.entry.ts`),
			await getEntryFile(appName, components)
		)

		await fs.writeFile(
			path.resolve(packDir, `${fullPackName}.builder.entry.ts`),
			await getBuilderEntryFile(appName, components)
		)
	}

	return entries
}
interface Flags {
	develop: boolean
	stats: boolean
}
const getLoaderPath = (loaderName: string): string => {
	return path.resolve(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"node_modules",
		loaderName
	)
}
const getWebpackConfig = (
	entries: EntryFileMap,
	flags: Flags
): webpack.Configuration => {
	const dev = flags.develop
	const devRule: RuleSetRule = {
		enforce: "pre",
		test: /\.js$/,
		loader: getLoaderPath("source-map-loader"),
	}
	return {
		// Configuration Object
		resolve: {
			// Add '.ts' and '.tsx' as resolvable extensions.
			extensions: [".ts", ".tsx", ".js"],
			alias: {
				crypto: "crypto-browserify",
				stream: "stream-browserify",
			},
		},
		module: {
			rules: [
				{
					test: /\.ts(x?)$/,
					exclude: /node_modules/,
					use: [
						{
							loader: getLoaderPath("ts-loader"),
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
			"@uesio/lazymonaco": "LazyMonaco",
			yaml: "yaml",
			"@material-ui/core": "MaterialUI",
			"@material-ui/core/SvgIcon": "MaterialUI.SvgIcon",
		},
	}
}

export { createEntryFiles, getWebpackConfig }
