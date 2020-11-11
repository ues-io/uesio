import { metadata } from '@uesio/constants';

const getPrefix = (workspace?: { app: string; name: string }) => {
	return workspace ? `/workspace/${workspace.app}/${workspace.name}` : '/site';
};

const postJSON = (url: string, body: object) => {
	return fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		...(body && {
			body: JSON.stringify(body),
		}),
	});
};

(window as any).monacoPublicPath = '/static/lazymonaco/';

// This is a really dumb thing that I had to do to get the aws-amplify sdk to work :(

// @ts-ignore
if (global === undefined) {
	var global = window;
}

const loader = (mergeData: any) => {
	// @ts-ignore
	new uesio.loader.Loader({
		getView: async (context: any, namespace: string, name: string) => {
			const prefix = getPrefix(context.getWorkspace());
			const response = await fetch(`${prefix}/views/${namespace}/${name}`);
			if (response.status !== 200) {
				throw new Error('View Not Found');
			}
			return response.text();
		},
		saveViews: async (context: any, saveRequest: any) => {
			const prefix = getPrefix(context.getWorkspace());
			const response = await postJSON(`${prefix}/views/save`, saveRequest);
			if (response.status != 200) {
				throw new Error('Save Failed');
			}
			return response.json();
		},
		getRoute: async (context: any, namespace: string, route: string) => {
			const prefix = getPrefix(context.getWorkspace());
			const response = await fetch(`${prefix}/routes/${namespace}/${route}`);
			if (response.status !== 200) {
				throw new Error('Route Not Found');
			}
			return response.json();
		},
		loadData: async (context: any, requestBody: any) => {
			const prefix = getPrefix(context.getWorkspace());
			const response = await postJSON(`${prefix}/wires/load`, requestBody);
			if (response.status != 200) {
				const error = await response.text();
				throw new Error(error);
			}
			return response.json();
		},
		saveData: async (context: any, requestBody: any) => {
			const prefix = getPrefix(context.getWorkspace());
			const response = await postJSON(`${prefix}/wires/save`, requestBody);
			if (response.status != 200) {
				const error = await response.text();
				throw new Error(error);
			}
			return response.json();
		},
		callBot: async (
			context: any,
			namespace: string,
			name: string,
			params: object
		) => {
			const prefix = getPrefix(context.getWorkspace());
			const response = await postJSON(
				`${prefix}/bots/call/${namespace}/${name}`,
				params
			);
			if (response.status != 200) {
				const error = await response.text();
				throw new Error(error);
			}
			return response.json();
		},
		getFileURL: (context: any, namespace: string, name: string) => {
			const prefix = getPrefix(context.getWorkspace());
			return `${prefix}/files/${namespace}/${name}`;
		},
		getUserFileURL: (context: any, userfileid: string) => {
			const prefix = getPrefix(context.getWorkspace());
			return `${prefix}/userfiles/download?userfileid=${encodeURIComponent(
				userfileid
			)}`;
		},
		deleteUserFile: async (context: any, userfileid: string) => {
			const prefix = getPrefix(context.getWorkspace());
			const url = `${prefix}/userfiles/delete?userfileid=${encodeURIComponent(
				userfileid
			)}`;
			const response = await fetch(url, {
				method: 'POST',
			});
			return response.text();
		},
		uploadFile: async (
			context: any,
			fileData: any,
			name: any,
			fileCollection: any,
			collectionID: any,
			recordID: any,
			fieldID: any
		) => {
			const prefix = getPrefix(context.getWorkspace());
			const url = `${prefix}/userfiles/upload`;
			const params = new URLSearchParams();
			params.append('name', name);
			params.append('filecollection', fileCollection);
			params.append('collectionid', collectionID);
			params.append('recordid', recordID);
			params.append('fieldid', fieldID);

			const response = await fetch(url + '?' + params.toString(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/octet-stream',
				},
				body: fileData,
			});

			return response.text();
		},

		getComponentPackURL: (
			context: any,
			namespace: string,
			name: string,
			buildMode: boolean
		) => {
			const prefix = getPrefix(context.getWorkspace());
			const buildModeSuffix = buildMode ? '/builder' : '';
			return `${prefix}/componentpacks/${namespace}/${name}${buildModeSuffix}`;
		},

		getBuilderCoreURL: () => {
			return '/static/buildtime/uesiobuildtime.js';
		},

		getMetadataList: async (
			context: any,
			metadataType: string,
			namespace: string,
			grouping: string
		) => {
			const prefix = getPrefix(context.getWorkspace());
			const mdTypeMap = metadata.METADATA;
			// @ts-ignore
			const mdType = mdTypeMap[metadataType];
			const groupingUrl = grouping ? `/${grouping}` : '';
			const response = await fetch(
				`${prefix}/metadata/types/${mdType}/namespace/${namespace}/list${groupingUrl}`
			);
			return response.json();
		},

		getAvailableNamespaces: async (context: any) => {
			const prefix = getPrefix(context.getWorkspace());
			const response = await fetch(`${prefix}/metadata/namespaces`);
			return response.json();
		},

		login: async (requestBody: object) => {
			const response = await postJSON('/site/auth/login', requestBody);
			return response.json();
		},

		logout: async () => {
			const response = await postJSON('/site/auth/logout', {});
			return response.json();
		},
	}).load(document.querySelector('#root'), mergeData);
};
