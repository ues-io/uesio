import { metadata } from "@uesio/ui"

declare global {
	interface Window {
		monacoPublicPath?: string
		uesioLoader: any
		global: any
	}
}

const getPrefix = (context: any) => {
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
window.uesioLoader = (mergeData: object) => {
	// @ts-ignore
	new uesio.loader.Loader({
		getView: async (context: any, namespace: string, name: string) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/views/${namespace}/${name}`)
			if (response.status !== 200) {
				throw new Error("View Not Found")
			}
			return response.text()
		},

		getTheme: async (context: any, namespace: string, name: string) => {
			const prefix = getPrefix(context)
			const response = await fetch(
				`${prefix}/themes/${namespace}/${name}`
			)
			if (response.status !== 200) {
				throw new Error("Theme Not Found")
			}
			return response.text()
		},

		getRoute: async (context: any, namespace: string, route: string) => {
			const prefix = getPrefix(context)
			const response = await fetch(
				`${prefix}/routes/${namespace}/${route}`
			)
			if (response.status !== 200) {
				throw new Error("Route Not Found")
			}
			return response.json()
		},

		loadData: async (context: any, requestBody: object) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/wires/load`, requestBody)
			if (response.status != 200) {
				const error = await response.text()
				throw new Error(error)
			}
			return response.json()
		},

		saveData: async (context: any, requestBody: object) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/wires/save`, requestBody)
			if (response.status != 200) {
				const error = await response.text()
				throw new Error(error)
			}
			return response.json()
		},

		callBot: async (
			context: any,
			namespace: string,
			name: string,
			params: object
		) => {
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

		getFileURL: (context: any, namespace: string, name: string) => {
			const prefix = getPrefix(context)
			return `${prefix}/files/${namespace}/${name}`
		},

		getUserFileURL: (context: any, userfileid: string) => {
			const prefix = getPrefix(context)
			return `${prefix}/userfiles/download?userfileid=${encodeURIComponent(
				userfileid
			)}`
		},

		uploadFile: async (
			context: any,
			fileData: any,
			name: string,
			fileCollection: string,
			collectionID: any,
			recordID: any,
			fieldID: any
		) => {
			const prefix = getPrefix(context)
			const url = `${prefix}/userfiles/upload`
			const params = new URLSearchParams()
			params.append("name", name)
			params.append("filecollection", fileCollection)
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

		getComponentPackURL: (
			context: any,
			namespace: string,
			name: string,
			buildMode: boolean
		) => {
			const prefix = getPrefix(context)
			const buildModeSuffix = buildMode ? "/builder" : ""
			return `${prefix}/componentpacks/${namespace}/${name}${buildModeSuffix}`
		},

		getMetadataList: async (
			context: any,
			metadataType: metadata.MetadataType,
			namespace: string,
			grouping: string
		) => {
			const prefix = getPrefix(context)
			const mdType = metadata.METADATA[metadataType]
			const groupingUrl = grouping ? `/${grouping}` : ""
			const response = await fetch(
				`${prefix}/metadata/types/${mdType}/namespace/${namespace}/list${groupingUrl}`
			)
			return response.json()
		},

		getAvailableNamespaces: async (context: any) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/metadata/namespaces`)
			return response.json()
		},

		getConfigValues: async (context: any) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/configvalues`)
			return response.json()
		},

		setConfigValue: async (context: any, key: string, value: string) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/configvalues/${key}`, {
				value,
			})
			return response.json()
		},

		getSecrets: async (context: any) => {
			const prefix = getPrefix(context)
			const response = await fetch(`${prefix}/secrets`)
			return response.json()
		},

		setSecret: async (context: any, key: string, value: string) => {
			const prefix = getPrefix(context)
			const response = await postJSON(`${prefix}/secrets/${key}`, {
				value,
			})
			return response.json()
		},

		login: async (requestBody: object) => {
			const response = await postJSON("/site/auth/login", requestBody)
			return response.json()
		},

		logout: async () => {
			const response = await postJSON("/site/auth/logout")
			return response.json()
		},
	}).load(document.querySelector("#root"), mergeData)
}
