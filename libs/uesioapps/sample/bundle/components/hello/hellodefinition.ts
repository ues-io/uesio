import { definition, builder } from "uesio"

type HelloDefinition = {
	greeting: string
}

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
