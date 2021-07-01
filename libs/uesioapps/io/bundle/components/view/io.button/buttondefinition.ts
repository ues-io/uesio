import { definition, builder, signal } from "@uesio/ui"

type ButtonDefinition = {
	text?: string
	signals?: signal.SignalDefinition[]
}

interface ButtonProps extends definition.BaseProps {
	definition: ButtonDefinition
}

const ButtonPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Button",
	defaultDefinition: () => ({
		text: "New Button",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	actions: [
		{
			label: "Run Signals",
			type: "RUN_SIGNALS",
			slot: "signals",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { ButtonProps, ButtonDefinition }

export default ButtonPropertyDefinition
