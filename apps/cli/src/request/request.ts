import https from "https"
import fetch, { Response, RequestInit, BodyInit } from "node-fetch"
import { getHostUrl } from "../config/config"

const agent = new https.Agent({
	rejectUnauthorized: false,
})

const makeFullUrl = async (url: string): Promise<string> => {
	const hostUrl = await getHostUrl()
	return `${hostUrl}/${url}`
}

const get = async (
	url: string,
	cookie?: string,
	init?: RequestInit
): Promise<Response> => {
	const fullUrl = await makeFullUrl(url)
	return fetch(fullUrl, {
		...init,
		agent,
		headers: {
			...init?.headers,
			...(cookie && {
				cookie,
			}),
		},
	})
}

const post = async (
	url: string,
	body: BodyInit | undefined,
	cookie?: string | null,
	init?: RequestInit
): Promise<Response> => {
	const fullUrl = await makeFullUrl(url)
	return fetch(fullUrl, {
		...init,
		agent,
		method: "post",
		headers: {
			...init?.headers,
			...(cookie && {
				cookie,
			}),
			"Content-Type": "application/json",
		},
		body,
	})
}

const parseJSON = async (response: Response) => {
	if (response.status === 200) {
		return await response.json()
	}
	const text = await response.text()
	throw new Error(text)
}

export { get, post, parseJSON }
