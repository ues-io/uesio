import os from "os"
import { promises as fs } from "fs"
import path from "path"
import yaml from "yaml"
import { metadata } from "#uesio/ui"
import { User } from "../auth/login"
import { get, parseJSON } from "../request/request"

type Config = {
	sessionId?: string
	activeWorkspaces?: Record<string, string>
	hostUrl?: string
}

type VersionInfo = {
	version: string
}

type BundleInfo = {
	name: string
	dependencies?: Record<string, VersionInfo>
}

const homedir = os.homedir()
const saveFile = path.join(homedir, ".uesio")

const validHosts = [
	"https://studio.uesio-dev.com:3000",
	"https://studio.ues.io",
	"https://studio.ues-dev.io",
	"https://studio.ues-uat.io",
]

const DEFAULT_HOST = "https://studio.uesio-dev.com:3000"

const fileExists = async (file: string): Promise<boolean> =>
	fs
		.access(file)
		.then(() => true)
		.catch(() => false)

const getConfig = async (): Promise<Config | null> => {
	const hasSessFile = await fileExists(saveFile)

	if (!hasSessFile) {
		return null
	}

	return JSON.parse(await fs.readFile(saveFile, "utf8"))
}

const setConfig = async (configObj: Config): Promise<void> => {
	await fs.writeFile(saveFile, JSON.stringify(configObj))
}

const getSessionId = async (): Promise<string | null> => {
	const config = await getConfig()
	return config?.sessionId || null
}

const setSessionId = async (value: string): Promise<void> => {
	const config = await getConfig()
	setConfig({ ...config, sessionId: value })
}

const getActiveWorkspace = async (app: string): Promise<string | null> => {
	const config = await getConfig()
	return config?.activeWorkspaces?.[app] || null
}

const setActiveWorkspace = async (
	app: string,
	workspace: string
): Promise<void> => {
	const config = await getConfig()
	const activeWorkspaces = config?.activeWorkspaces || {}
	setConfig({
		...config,
		activeWorkspaces: { ...activeWorkspaces, [app]: workspace },
	})
}

const getHostUrl = async (): Promise<string> => {
	const config = await getConfig()
	return config?.hostUrl || DEFAULT_HOST
}

const setHostUrl = async (value: string): Promise<void> => {
	const config = await getConfig()
	setConfig({ ...config, hostUrl: value })
}

const getBundleInfo = async (): Promise<BundleInfo> => {
	const bundleInfoText = await fs.readFile(
		path.resolve("./bundle/bundle.yaml"),
		"utf8"
	)
	const bundleInfo: BundleInfo = yaml.parse(bundleInfoText)
	return bundleInfo
}

const getKeyFromPath = (
	app: string,
	metadataType: metadata.MetadataType,
	path: string,
	grouping?: string
) => {
	if (
		metadataType === "COLLECTION" ||
		metadataType === "VIEW" ||
		metadataType === "THEME"
	) {
		if (grouping) {
			throw new Error("Conditions not allowed for this type")
		}
		// TODO: Should be os path separator
		const parts = path.split("/")
		if (parts.length !== 1 || !parts[0].endsWith(".yaml")) {
			// Ignore this file
			return ""
		}
		return app + "." + parts[0].substring(0, parts[0].length - 5)
	}
	if (metadataType === "FIELD") {
		if (!grouping) {
			throw new Error("Must specify collection for fields list")
		}
		// TODO: Should be os path separator
		const parts = path.split("/")
		if (parts.length !== 4 || !parts[3].endsWith(".yaml")) {
			// Ignore this file
			return ""
		}

		const collection = `${parts[0]}/${parts[1]}.${parts[2]}`

		if (collection !== grouping) {
			// Ignore this file
			return ""
		}
		return app + "." + parts[3].substring(0, parts[3].length - 5)
	}
	if (metadataType === "COMPONENT") {
		if (grouping) {
			throw new Error("Conditions not allowed for this type")
		}
		// TODO: Should be os path separator
		const parts = path.split("/")
		if (parts.length !== 3 || !parts[2].endsWith(".tsx")) {
			// Ignore this file
			return ""
		}
		return app + "." + parts[1]
	}
	return ""
}

const getFiles = async (dir: string): Promise<string[] | null> => {
	const dirExists = await fileExists(dir)

	if (!dirExists) {
		return null
	}

	const dirents = await fs.readdir(dir, { withFileTypes: true })
	const files = await Promise.all(
		dirents.map((dirent) => {
			const res = dir + dirent.name
			return dirent.isDirectory() ? getFiles(res + "/") : res
		})
	)
	return Array.prototype.concat(...files)
}

const getLocalMetadataItemsList = async (
	app: string,
	metadataType: metadata.MetadataType,
	grouping?: string
): Promise<string[]> => {
	const metadataDir = metadata.METADATA[metadataType]
	const dirPath = "./bundle/" + metadataDir + "/"

	const files = await getFiles(dirPath)

	if (!files) {
		return []
	}

	return files.flatMap((fileName) => {
		const fileKey = getKeyFromPath(
			app,
			metadataType,
			fileName.slice(dirPath.length),
			grouping
		)
		return fileKey ? [fileKey] : []
	})
}

const getApp = async (): Promise<string> => {
	const bundleInfo = await getBundleInfo()
	return bundleInfo.name
}

const getVersion = async (app: string): Promise<string> => {
	const bundleInfo = await getBundleInfo()
	const versionInfo = bundleInfo.dependencies?.[app]
	if (!versionInfo || !versionInfo.version) {
		throw new Error("No version found for that namespace")
	}
	return versionInfo.version
}

const getMetadataList = async (
	metadataType: metadata.MetadataType,
	app: string,
	version: string,
	user: User,
	grouping?: string
): Promise<string[]> => {
	const bundleInfo = await getBundleInfo()
	// First get items installed here.
	const localItems = await getLocalMetadataItemsList(
		app,
		metadataType,
		grouping
	)
	// For components, only return local ones
	if (metadataType === "COMPONENT") {
		return localItems
	}
	for (const dep in bundleInfo.dependencies) {
		const metadataDir = metadata.METADATA[metadataType]
		const groupingUrl = grouping ? `/${grouping}` : ""
		const listResponse = await get(
			`version/${app}/${dep}/${version}/metadata/types/${metadataDir}/list${groupingUrl}`,
			user.cookie
		)
		const list = await parseJSON(listResponse)
		localItems.push(...Object.keys(list))
	}
	return localItems
}

const getWorkspace = async (): Promise<string | null> => {
	const app = await getApp()
	return await getActiveWorkspace(app)
}

const setWorkspace = async (workspace: string): Promise<void> => {
	const app = await getApp()
	await setActiveWorkspace(app, workspace)
}

export {
	getSessionId,
	setSessionId,
	fileExists,
	Config,
	getApp,
	getVersion,
	getWorkspace,
	setWorkspace,
	setActiveWorkspace,
	getMetadataList,
	getHostUrl,
	setHostUrl,
	validHosts,
}
