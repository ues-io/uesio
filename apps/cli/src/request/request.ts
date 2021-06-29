import https from "https"
import fetch, { Response, RequestInit, BodyInit } from "node-fetch"

const agent = new https.Agent({
	rejectUnauthorized: false,
})

const makeFullURL = (url: string): string =>
	`https://studio.uesio-dev.com:3000/${url}`

const get = (
	url: string,
	cookie?: string,
	init?: RequestInit
): Promise<Response> =>
	fetch(makeFullURL(url), {
		...init,
		agent,
		headers: {
			...init?.headers,
			...(cookie && {
				cookie,
			}),
		},
	})

const post = (
	url: string,
	body: BodyInit | undefined,
	cookie?: string,
	init?: RequestInit
): Promise<Response> =>
	fetch(makeFullURL(url), {
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

export { get, post }
