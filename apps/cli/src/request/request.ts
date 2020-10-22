import * as https from "https"
import fetch, { Response, RequestInit } from "node-fetch"

const agent = new https.Agent({
	rejectUnauthorized: false,
})

const makeFullURL = (url: string): string => {
	return `https://uesio-dev.com:3000/${url}`
}

const get = (
	url: string,
	cookie?: string,
	init?: RequestInit | undefined
): Promise<Response> => {
	return fetch(makeFullURL(url), {
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

const post = (
	url: string,
	body:
		| string
		| ArrayBuffer
		| ArrayBufferView
		| NodeJS.ReadableStream
		| URLSearchParams
		| undefined,
	cookie?: string,
	init?: RequestInit | undefined
): Promise<Response> => {
	return fetch(makeFullURL(url), {
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

export { get, post }
