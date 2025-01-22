
declare module "@uesio/app/selectlists/uesio/tests" {
	export type Selectlist = "one" | "two" | "three" | "four" | "five"

	export type ToolCategory = "Hand" | "Machine"
}
declare module "@uesio/app/bots/listener/uesio/tests/add_numbers" {

	type Params = {
		a: number
		b: number
		c?: number
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/call_custom_run_action" {

	type Params = {
		latitude: number
		longitude: number
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/call_http_api" {

	type Params = {
		a: number
		b: number
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/prefix_values" {

	type Params = {
		prefix: string
		values: string[]
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/recursive_add_numbers" {

	type Params = {
		a: number
		b: number
		c?: number
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/secret_access_tester" {

	type Params = {
		integrationName: string
		actionName: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/tester_createlogin" {

	type Params = {
		username: string
		email: string
		code: string
		host: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/tester_resetpassword" {

	type Params = {
		username: string
		email: string
		code: string
		host: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/tests/tester_signup" {

	type Params = {
		username: string
		email: string
		code: string
		host: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/route/uesio/tests/tools_api_by_brand" {

	type Params = {
		brand_name: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/route/uesio/tests/tools_api_query_params" {
	declare type ToolCategory = import("@uesio/app/selectlists/uesio/tests").ToolCategory
	type Params = {
		brand_name: string
		category?: ToolCategory
		type?: string
		limit?: number
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/runaction/uesio/tests/get_weather_forecast" {

	type Params = {
		latitude: number
		longitude: number
	}

	export type {
		Params
	}
}
