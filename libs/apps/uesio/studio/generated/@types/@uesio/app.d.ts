
declare module "@uesio/app/selectlists/uesio/studio" {
	export type Actiontype = "OPEN" | "SUBMITTED" | "IN_REVIEW" | "REJECTED" | "APPROVED" | "PUBLISHED"
	export type Authsourcetypes = "google" | "saml" | "mock"
	export type Autopopulatetypes = "CREATE" | "UPDATE"
	export type Botparamtypes = "CHECKBOX" | "LIST" | "NUMBER" | "TEXT" | "SELECT"
	export type Bundlelistingstatus = "OPEN" | "SUBMITTED" | "IN_REVIEW" | "REJECTED" | "APPROVED" | "PUBLISHED"
	export type Collectionaccesstypes = "protected"
	export type Credentialtypes = "API_KEY" | "AWS_KEY" | "AWS_ASSUME_ROLE" | "OAUTH2_CREDENTIALS" | "SAML_CREDENTIALS" | "POSTGRESQL_CONNECTION" | "USERNAME_PASSWORD" | ""
	export type Emailcontenttype = "text/html" | "text/plain"
	export type Featureflagtypes = "CHECKBOX" | "NUMBER"
	export type Fieldtypes = "AUTONUMBER" | "CHECKBOX" | "DATE" | "EMAIL" | "FILE" | "FORMULA" | "LIST" | "LONGTEXT" | "MAP" | "METADATA" | "MULTISELECT" | "NUMBER" | "REFERENCE" | "REFERENCEGROUP" | "SELECT" | "STRUCT" | "TEXT" | "TIMESTAMP" | "USER"
	export type Fieldvalidatetypes = "REGEX" | "METADATA" | "YAML"
	export type Formulafieldreturntypes = "CHECKBOX" | "DATE" | "NUMBER" | "LONGTEXT" | "MAP" | "TEXT" | "TIMESTAMP"
	export type Linkrelationships = "alternate" | "author" | "canonical" | "dns-prefetch" | "help" | "icon" | "license" | "next" | "pingback" | "preconnect" | "prefetch" | "preload" | "prerender" | "prev" | "search" | "stylesheet"
	export type Metatags = "--standard--" | "author" | "copyright" | "date" | "description" | "generator" | "keywords" | "language" | "robots" | "subject" | "--google--" | "google" | "googlebot" | "google-site-verification" | "--og--" | "og:title" | "og:type" | "og:url" | "og:image" | "og:site_name" | "og:description" | "og:email" | "og:phone_number" | "application-name" | "og:video" | "og:video:height" | "og:video:width" | "og:video:type" | "og:audio" | "og:audio:title" | "og:audio:artist" | "og:audio:album" | "og:audio:type"
	export type Recordchallengetokenaccess = "read" | "readwrite"
	export type Role = "none" | "maintainer" | "admin"
	export type Sitedomaintype = "domain" | "subdomain"
	export type Subfieldtypes = "CHECKBOX" | "DATE" | "MULTISELECT" | "NUMBER" | "LONGTEXT" | "SELECT" | "TEXT" | "TIMESTAMP"
	export type Subtype = "DATE" | "LONGTEXT" | "NUMBER" | "STRUCT" | "TEXT" | "TIMESTAMP"
	export type Taglocation = "head" | "body"
	export type Tagtype = "meta" | "link"
	export type Usageactiontype = "DOWNLOAD" | "DOWNLOAD_BYTES" | "LOAD" | "SAVE" | "UPLOAD" | "UPLOAD_BYTES"
	export type Usagemetadataname = "uesio/core.platform"
	export type Usagemetadatatype = "ROUTE" | "DATASOURCE" | "FILESOURCE"
	export type Useraccesstokentype = "lookup"
}
declare module "@uesio/app/bots/listener/uesio/studio/createlogin" {

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
declare module "@uesio/app/bots/listener/uesio/studio/resetpassword" {

	type Params = {
		username: string
		email?: string
		code: string
		host: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/studio/select_plan" {

	type Params = {
		plan: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/listener/uesio/studio/signup" {

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
declare module "@uesio/app/bots/listener/uesio/studio/signupgoogle" {

	type Params = {
		username: string
		email: string
	}

	export type {
		Params
	}
}
declare module "@uesio/app/bots/route/uesio/studio/paymentsuccess" {

	type Params = {
		session_id: string
	}

	export type {
		Params
	}
}