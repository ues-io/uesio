import { definition, builder } from "@uesio/ui"

type ProgressGaugeDefinition = {
	total: number
	current: number
	indicator?: "on" | "off" | "auto"
}

interface ProgressGaugeProps extends definition.BaseProps {
	definition: ProgressGaugeDefinition
}

const ProgressGaugePropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		total: "1",
		current: "1",
		indicator: "off",
	}),
	title: "Progressgauge",
	sections: [],
	properties: [
		{
			name: "total",
			type: "TEXT",
			label: "Total Steps",
		},
		{
			name: "current",
			type: "TEXT",
			label: "Current Step",
		},
		{
			name: "indicator",
			type: "SELECT",
			label: "Variant",
			options: [
				{
					value: "on",
					label: "On",
				},
				{
					value: "off",
					label: "Off",
				},
				{
					value: "auto",
					label: "Hover",
				},
			],
		},
	],
	traits: ["uesio.standalone"],
}
export { ProgressGaugeProps, ProgressGaugeDefinition }

export default ProgressGaugePropertyDefinition
