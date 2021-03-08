import { definition, builder } from "@uesio/ui"

type ErrorDefinition = {
	message: string
	subMessage: string
	url: string
	color: string
	fontColor: string
}

interface ErrorProps extends definition.BaseProps {
	definition: ErrorDefinition
}

const ErrorPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		message: "404 :(",
		subMessage: "Page not found, take me back to:",
		url: "https://uesio-dev.com:3000/",
		color: "#2D72D9",
		fontColor: "#FFFFFF",
	}),

	title: "Error",
	properties: [
		{
			name: "message",
			type: "TEXT",
			label: "Message",
		},
		{
			name: "sub_message",
			type: "TEXT",
			label: "Sub Message",
		},
		{
			name: "url",
			type: "TEXT",
			label: "Url",
		},
		{
			name: "color",
			type: "TEXT",
			label: "Color",
		},
		{
			name: "font_color",
			type: "TEXT",
			label: "Font Color",
		},
	],
	sections: [],
	traits: ["uesio.standalone"],
}
export { ErrorProps, ErrorDefinition }

export default ErrorPropertyDefinition
