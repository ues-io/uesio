import { definition, builder, signal } from "@uesio/ui"

type IconButtonDefinition = {
	icon: string
	signals?: signal.SignalDefinition[]
} & definition.BaseDefinition

interface IconButtonProps extends definition.BaseProps {
	definition: IconButtonDefinition
}

const IconButtonPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Button",
	defaultDefinition: () => ({
		icon: "add",
	}),
	properties: [
		{
			name: "icon",
			type: "TEXT",
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
}
export { IconButtonProps, IconButtonDefinition }

export default IconButtonPropertyDefinition
