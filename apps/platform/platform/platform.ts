import { loader, metadata, state, context } from "@uesio/ui"

declare global {
	interface Window {
		monacoPublicPath?: string
		uesioLoader: (mergeData: state.InitialState) => void
		global: any
	}
}

const getPrefix = (context: context.Context) => {
	const workspace = context.getWorkspace()
	if (workspace) {
		return `/workspace/${workspace.app}/${workspace.name}`
	}
	const siteadmin = context.getSiteAdmin()
	if (siteadmin) {
		return `/siteadmin/${siteadmin.app}/${siteadmin.name}`
	}
	return "/site"
}

const postJSON = (url: string, body?: object) => {
	return fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		...(body && {
			body: JSON.stringify(body),
		}),
	})
}

window.monacoPublicPath = "/static/lazymonaco/"

// aws-sdk requires global to exist
window.global = window

// uesioLoader is accessible outside the generated webpack bundle
window.uesioLoader = (mergeData) => {
	new loader.Loader({
		getView: async (context, namespace, name) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/views/${namespace}/${name}`)
			if (response.status !== 200) {
				throw new Error("View Not Found")
			}
			return response.text()
		},

		getTheme: async (context, namespace, name) => {
			const prefix = getPrefix(context)
			const response = await fetch(
				`${prefix}/themes/${namespace}/${name}`
			)
			if (response.status !== 200) {
				throw new Error("Theme Not Found")
			}
			return response.text()
		},

		getRoute: async (context, namespace, route) => {
			const prefix = getPrefix(context)
			const response = await fetch(
				`${prefix}/routes/${namespace}/${route}`
			)
			if (response.status !== 200) {
				throw new Error("Route Not Found")
			}
			return response.json()
		},

		loadData: async (context, requestBody) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/wires/load`, requestBody)
			if (response.status != 200) {
				const error = await response.text()
				throw new Error(error)
			}
			return response.json()
		},

		saveData: async (context, requestBody) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/wires/save`, requestBody)
			if (response.status != 200) {
				const error = await response.text()
				throw new Error(error)
			}
			return response.json()
		},

		callBot: async (context, namespace, name, params) => {
			const prefix = getPrefix(context)
			const response = await postJSON(
				`${prefix}/bots/call/${namespace}/${name}`,
				params
			)
			if (response.status != 200) {
				const error = await response.text()
				throw new Error(error)
			}
			return response.json()
		},

		getFileURL: (context, namespace, name) => {
			const prefix = getPrefix(context)
			return `${prefix}/files/${namespace}/${name}`
		},

		getUserFileURL: (context, userfileid) => {
			const prefix = getPrefix(context)
			return `${prefix}/userfiles/download?userfileid=${encodeURIComponent(
				userfileid
			)}`
		},

		uploadFile: async (
			context,
			fileData,
			collectionID,
			recordID,
			fieldID
		) => {
			const prefix = getPrefix(context)
			const url = `${prefix}/userfiles/upload`
			const params = new URLSearchParams()
			params.append("name", fileData.name)
			params.append("collectionid", collectionID)
			params.append("recordid", recordID)
			params.append("fieldid", fieldID)

			const response = await fetch(url + "?" + params.toString(), {
				method: "POST",
				headers: {
					"Content-Type": "application/octet-stream",
				},
				body: fileData,
			})

			return response.json()
		},

		deleteFile: async (context, userFileID) => {
			const prefix = getPrefix(context)
			const url = `${prefix}/userfiles/delete/${userFileID}`
			const response = await fetch(url, {
				method: "POST",
			})
			return response.json()
		},

		getComponentPackURL: (context, namespace, name, buildMode) => {
			const prefix = getPrefix(context)
			const buildModeSuffix = buildMode ? "/builder" : ""
			return `${prefix}/componentpacks/${namespace}/${name}${buildModeSuffix}`
		},

		getMetadataList: async (context, metadataType, namespace, grouping) => {
			const prefix = getPrefix(context)
			const mdType = metadata.METADATA[metadataType]
			const groupingUrl = grouping ? `/${grouping}` : ""
			const response = await fetch(
				`${prefix}/metadata/types/${mdType}/namespace/${namespace}/list${groupingUrl}`
			)
			return response.json()
		},

		getAvailableNamespaces: async (context) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/metadata/namespaces`)
			return response.json()
		},

		getConfigValues: async (context) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/configvalues`)
			return response.json()
		},

		setConfigValue: async (context, key, value) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/configvalues/${key}`, {
				value,
			})
			return response.json()
		},

		getSecrets: async (context) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/secrets`)
			return response.json()
		},

		setSecret: async (context, key, value) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/secrets/${key}`, {
				value,
			})
			return response.json()
		},

		login: async (requestBody) => {
			const response = await postJSON("/site/auth/login", requestBody)
			return response.json()
		},

		logout: async () => {
			const response = await postJSON("/site/auth/logout")
			return response.json()
		},
	}).load(document.querySelector("#root"), mergeData)
}
