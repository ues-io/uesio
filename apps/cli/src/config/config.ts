import * as os from "os"
import { promises as fs } from "fs"
import * as path from "path"
import * as yaml from "yaml"

type Config = {
	sessionId?: string
	activeWorkspaces?: Record<string, string>
	hostUrl?: string
}

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

const getApp = async (): Promise<string> => {
	const bundleInfo = await getBundleInfo()
	return bundleInfo.name
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
	getWorkspace,
	setWorkspace,
	getHostUrl,
	setHostUrl,
	validHosts,
}
