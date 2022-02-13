import * as os from "os"
import { promises as fs } from "fs"
import * as path from "path"
import * as yaml from "yaml"
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
	metadataType: metadata.MetadataType,
	path: string,
	conditions: Record<string, string>
) => {
	if (metadataType === "COLLECTION") {
		if (Object.keys(conditions).length !== 0) {
			throw new Error("Conditions not allowed for this type")
		}
		// TODO: Should be os path separator
		const parts = path.split("/")
		if (parts.length !== 1 || !parts[0].endsWith(".yaml")) {
			// Ignore this file
			return ""
		}
		return parts[0].substring(0, parts[0].length - 5)
	}
	return ""
}

const getLocalMetadataItemsList = async (
	metadataType: metadata.MetadataType
): Promise<string[]> => {
	const metadataDir = metadata.METADATA[metadataType]
	const files = await fs.readdir("./bundle/" + metadataDir + "/")
	return files.map((fileName) =>
		// Get Key from Path
		// For most items we just remove the ".yaml"
		getKeyFromPath(metadataType, fileName, {})
	)
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
	user: User
): Promise<string[]> => {
	const bundleInfo = await getBundleInfo()
	// First get items installed here.
	const localItems = await getLocalMetadataItemsList(metadataType)
	for (const dep in bundleInfo.dependencies) {
		const metadataDir = metadata.METADATA[metadataType]
		const listResponse = await get(
			`version/${app}/${dep}/${version}/metadata/types/${metadataDir}/list`,
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
	getMetadataList,
	getHostUrl,
	setHostUrl,
	validHosts,
}
