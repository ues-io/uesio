import { definition, builder, signal } from "uesio"

type ButtonDefinition = {
	text?: string
	color?: "inherit" | "primary" | "secondary" | "default"
	variant?: "text" | "outlined" | "contained"
	signals?: signal.ComponentSignal[]
	fullWidth?: boolean
	margin?: number
}

interface ButtonProps extends definition.BaseProps {
	definition: ButtonDefinition
}

const ButtonPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Button",
	defaultDefinition: () => ({
		color: "primary",
		variant: "contained",
		text: "New Button",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "color",
			type: "SELECT",
			label: "Color",
			options: [
				{
					value: "primary",
					label: "Primary",
				},
				{
					value: "secondary",
					label: "Secondary",
				},
			],
		},
		{
			name: "variant",
			type: "SELECT",
			label: "Variant",
			options: [
				{
					value: "text",
					label: "Text",
				},
				{
					value: "outlined",
					label: "Outlined",
				},
				{
					value: "contained",
					label: "Contained",
				},
			],
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
export { ButtonProps, ButtonDefinition }

export default ButtonPropertyDefinition
