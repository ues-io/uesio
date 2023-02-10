//
// Type definitions for server-side Bot APIs
//

declare module "uesio/bots" {
	interface BotParamsApi {
		get: (
			paramName: string
		) => string | boolean | number | object | undefined
	}

	interface ListenerBotApi {
		params: BotParamsApi
		addResult: (
			key: string,
			value: string | boolean | number | object
		) => void
	}
	export type { BotParamsApi, ListenerBotApi }
}
