import { definition, builder, signal } from "@uesio/ui"

type ButtonDefinition = {
	text?: string
	icon?: string
	signals?: signal.SignalDefinition[]
	hotkey?: string
} & definition.BaseDefinition

interface ButtonProps extends definition.BaseProps {
	definition: ButtonDefinition
}

const ButtonPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Button",
	description: "Run signals based on user interaction.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New Button",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "icon",
			type: "ICON",
			label: "Icon",
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
	category: "INTERACTION",
}
export { ButtonProps, ButtonDefinition }

export default ButtonPropertyDefinition
