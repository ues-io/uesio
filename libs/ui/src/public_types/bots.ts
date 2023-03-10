//
// Type definitions for server-side Bot APIs
//

declare module "uesio/bots" {
	interface BotParamsApi {
		get: (
			paramName: string
		) => string | boolean | number | object | undefined
	}

	interface FieldRequest {
		id: string
		fields?: FieldRequest[]
	}

	type Conjunction = "AND" | "OR"

	type ConditionOperator =
		| "EQ"
		| "NOT_EQ"
		| "GT"
		| "LT"
		| "GTE"
		| "LTE"
		| "IN"
		| "IS_BLANK"
		| "IS_NOT_BLANK"

	type FieldValue = string | number | boolean | object | null
	type ConditionType = "SEARCH" | "GROUP"

	interface ConditionRequest {
		field: string
		operator: ConditionOperator
		value?: FieldValue
		type?: ConditionType
		conjunction?: Conjunction
		fields?: string[]
		conditions?: ConditionRequest[]
		subcollection?: string
		subfield?: string
	}

	interface LoadOrder {
		field: string
		desc: boolean
	}

	interface Record {
		GetField: (field: string) => FieldValue | undefined
		SetField: (field: string, value: FieldValue) => void
	}

	interface LoadRequest {
		collection: string
		fields?: FieldRequest[]
		conditions?: ConditionRequest[]
		order?: LoadOrder[]
	}

	interface ChangeApi {
		get: (field: string) => FieldValue
		getOld: (field: string) => FieldValue
		set: (field: string, value: FieldValue) => void
		addError: (error: string) => void
	}

	interface InsertsApi {
		get: () => ChangeApi[]
	}

	interface UpdatesApi {
		get: () => ChangeApi[]
	}

	interface DeletesApi {
		get: () => string[]
	}

	interface BeforeSaveBotApi {
		addError: (error: string) => void
		load: (loadRequest: LoadRequest) => Record[]
		deletes: DeletesApi
		inserts: InsertsApi
		updates: UpdatesApi
	}

	interface AfterSaveBotApi extends BeforeSaveBotApi {
		save: (collectionName: string, records: Record[]) => void
		sendMessage: (
			notificationSource: string,
			subject: string,
			body: string,
			from: string,
			to: string
		) => void
		sendEmail: (
			notificationSource: string,
			subject: string,
			body: string,
			from: string,
			to: string[],
			cc: string[],
			bcc: string[]
		) => void
	}

	interface ListenerBotApi {
		addResult: (key: string, value: FieldValue | undefined) => void
		load: (loadRequest: LoadRequest) => Record[]
		params: BotParamsApi
		save: (collectionName: string, records: Record[]) => void
		sendMessage: (
			notificationSource: string,
			subject: string,
			body: string,
			from: string,
			to: string
		) => void
		sendEmail: (
			notificationSource: string,
			subject: string,
			body: string,
			from: string,
			to: string[],
			cc: string[],
			bcc: string[]
		) => void
	}

	export type {
		// Top-level APIs
		ListenerBotApi,
		BeforeSaveBotApi,
		AfterSaveBotApi,

		// Types
		BotParamsApi,
		ConditionOperator,
		ConditionRequest,
		ConditionType,
		ChangeApi,
		FieldRequest,
		FieldValue,
		LoadOrder,
		LoadRequest,
		Record,
	}
}
