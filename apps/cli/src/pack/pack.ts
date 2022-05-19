import { fileExists, getApp } from "../config/config"
import path from "path"
import { promises as fs } from "fs"
import yaml from "yaml"

type ComponentMap = {
	[key: string]: unknown
}

type EntryFileMap = Record<string, boolean>

const factory = ['import { component } from "@uesio/ui";']

const getEntryFile = async (
	namespace: string,
	components: ComponentMap,
	utilityComponents: ComponentMap
): Promise<string> => {
	// Create Runtime Entrypoint
	const imports = []
	const registrations = []

	for (const key in components) {
		const hasDefinition = await fileExists(
			path.resolve(`./bundle/components/view/${key}/${key}.tsx`)
		)
		if (hasDefinition) {
			const hasSignals = await fileExists(
				path.resolve(`./bundle/components/view/${key}/signals.ts`)
			)
			imports.push(
				`import ${key} from "../../components/view/${key}/${key}";`
			)

			if (hasSignals) {
				imports.push(
					`import ${key}signals from "../../components/view/${key}/signals";`
				)
			}
			registrations.push(
				`component.registry.register("${namespace}.${key}", ${key}${
					hasSignals ? `, ${key}signals` : ""
				});`
			)
		}
	}

	for (const key in utilityComponents) {
		const hasDefinition = await fileExists(
			path.resolve(`./bundle/components/utility/${key}/${key}.tsx`)
		)
		if (hasDefinition) {
			imports.push(
				`import ${key}_utility from "../../components/utility/${key}/${key}";`
			)

			registrations.push(
				`component.registry.registerUtilityComponent("${namespace}.${key}", ${key}_utility);`
			)
		}
	}

	return factory.concat(imports, registrations).join("\n")
}

const getBuilderEntryFile = async (
	namespace: string,
	components: ComponentMap
): Promise<string> => {
	// Create Buildtime Entrypoint
	const builderImports = []
	const defImports = []
	const builderRegistrations = []

	for (const key in components) {
		const builderName = `${key}builder`
		const propDefName = `${key}definition`

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
				`component.registry.registerBuilder("${namespace}.${key}", ${
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
		entries[packName + "/runtime"] = true
		entries[packName + "/builder"] = true

		await fs.writeFile(
			path.resolve(packDir, `${packName}/runtime.ts`),
			await getEntryFile(appName, viewComponents, utilityComponents)
		)

		await fs.writeFile(
			path.resolve(packDir, `${packName}/builder.ts`),
			await getBuilderEntryFile(appName, viewComponents)
		)
	}

	return entries
}

export { createEntryFiles }
