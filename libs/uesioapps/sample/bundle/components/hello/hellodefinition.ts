import { definition, builder } from "@uesio/ui"

type HelloDefinition = {
	greeting: string
} & definition.BaseDefinition

interface HelloProps extends definition.BaseProps {
	definition: HelloDefinition
}

const HelloPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		greeting: "Yo!",
	}),
	title: "Hello Sample",
	sections: [],
	properties: [
		{
			name: "greeting",
			type: "TEXT",
			label: "Greeting",
		},
	],

	traits: ["uesio.standalone"],
}
export { HelloProps, HelloDefinition }

export default HelloPropertyDefinition
