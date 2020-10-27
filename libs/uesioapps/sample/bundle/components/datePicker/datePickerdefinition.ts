import { definition, builder } from "@uesio/ui"

type DatePickerDefinition = {
	label?: string
	color?: "primary" | "secondary"
	variant?: "outlined" | "filled" | "standard"
}
interface DatePickerProps extends definition.BaseProps {
	definition: DatePickerDefinition
}

const DatePickerPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		label: "Date picker inline",
		color: "primary",
		variant: "standard"
	}),
	title: "Date picker",
	sections: [],
	properties: [
		{
			name: "label",
			type: "TEXT",
			label: "Label",
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
					value: "outlined",
					label: "Outlimed",
				},
				{
					value: "standard",
					label: "Standard",
				},
				{
					value: "filled",
					label: "Filled",
				},
			],
		},
	],
	traits: ["uesio.standalone"],
}
export { DatePickerProps, DatePickerDefinition }

export default DatePickerPropertyDefinition