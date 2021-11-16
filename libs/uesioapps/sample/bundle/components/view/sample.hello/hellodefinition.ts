import { definition, builder } from "@uesio/ui"

type HelloDefinition = {
	greeting: string
	pink: boolean
}

interface HelloProps extends definition.BaseProps {
	definition: HelloDefinition
}

const HelloPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		greeting: "Yo!",
		pink: false,
	}),
	description: "Just a button",
	link: "https://docs.ues.io/",
	title: "Hello Sample",
	sections: [],
	properties: [
		{
			name: "greeting",
			type: "TEXT",
			label: "Greeting",
		},
		{
			name: "pink",
			type: "BOOLEAN",
			label: "Pink?",
		},
	],
	classes: ["root"],
	type: "component",
	traits: ["uesio.standalone"],
}
export { HelloProps, HelloDefinition }

export default HelloPropertyDefinition
