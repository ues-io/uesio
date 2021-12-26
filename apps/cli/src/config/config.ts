import * as os from "os"
import { promises as fs } from "fs"
import * as path from "path"
import * as yaml from "yaml"

type Config = {
	sessionId?: string
	workspaceId?: string
	appId?: string
	hostUrl?: string
}

const SESSION_ID_KEY = "sessionId"
const WORKSPACE_ID_KEY = "workspaceId"
const APP_ID_KEY = "appId"
const HOST_URL_KEY = "hostUrl"

type ConfigKey =
	| typeof SESSION_ID_KEY
	| typeof WORKSPACE_ID_KEY
	| typeof APP_ID_KEY
	| typeof HOST_URL_KEY

type BundleInfo = {
	name: string
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

const getConfigValue = async (key: ConfigKey): Promise<string | null> => {
	const config = await getConfig()
	return config?.[key] || null
}

const setConfigValue = async (key: ConfigKey, value: string): Promise<void> =>
	setConfig({ ...(await getConfig()), [key]: value })

const getSessionId = async (): Promise<string | null> =>
	getConfigValue(SESSION_ID_KEY)

const setSessionId = async (value: string): Promise<void> =>
	setConfigValue(SESSION_ID_KEY, value)

const getWorkspaceId = async (): Promise<string | null> =>
	getConfigValue(WORKSPACE_ID_KEY)

const setWorkspaceId = async (value: string): Promise<void> =>
	setConfigValue(WORKSPACE_ID_KEY, value)

const getHostUrl = async (): Promise<string> => {
	const url = await getConfigValue(HOST_URL_KEY)
	return url || DEFAULT_HOST
}

const setHostUrl = async (value: string): Promise<void> =>
	setConfigValue(HOST_URL_KEY, value)

const getAppId = async (): Promise<string | null> => getConfigValue(APP_ID_KEY)

const setAppId = async (value: string): Promise<void> =>
	setConfigValue(APP_ID_KEY, value)

const getBundleInfo = async (): Promise<BundleInfo> => {
	const bundleInfoText = await fs.readFile(
		path.resolve("./bundle/bundle.yaml"),
		"utf8"
	)
	const bundleInfo: BundleInfo = yaml.parse(bundleInfoText)
	return bundleInfo
}

const getApp = async (): Promise<string> => {
	const bundleInfo = await getBundleInfo()
	return bundleInfo.name
}

const getWorkspace = async (): Promise<string | null> => {
	const workspaceId = await getWorkspaceId()
	const appIdPref = await getAppId()
	const appFromBundle = await getApp()
	// Make sure the configured app id and the workspace app id match
	if (appIdPref !== appFromBundle) {
		throw Error(
			"The app you are attempting to modify is different from your appId in your .uesio file"
		)
	}
	return workspaceId
}

const setWorkspace = async (workspace: string): Promise<void> => {
	const app = await getApp()
	await setAppId(app)
	await setWorkspaceId(workspace)
}

export {
	getSessionId,
	setSessionId,
	fileExists,
	Config,
	getApp,
	getWorkspace,
	setWorkspace,
	getHostUrl,
	setHostUrl,
	validHosts,
}
