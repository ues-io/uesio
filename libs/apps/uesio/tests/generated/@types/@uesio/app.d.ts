
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
declare module "@uesio/app/bots/listener/uesio/tests/tester_forgotpassword" {
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