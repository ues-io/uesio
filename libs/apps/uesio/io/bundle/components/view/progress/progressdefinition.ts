import { definition, builder } from "@uesio/ui"

type ProgressDefinition = {
	id: string
	isAnimating: boolean
	fullscreen: boolean
	type: string
	shape: string
	progress: number
} & definition.BaseDefinition

interface ProgressProps extends definition.BaseProps {
	definition: ProgressDefinition
}

const ProgressPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Progress",
	description: "Run signals based on user interaction.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New Progress",
	}),
	properties: [
		{
			name: "id",
			type: "TEXT",
			label: "id",
		},
		{
			name: "isAnimating",
			type: "BOOLEAN",
			label: "Is Animating",
		},
		{
			name: "fullscreen",
			type: "BOOLEAN",
			label: "Fullscreen",
		},
		{
			name: "type",
			type: "SELECT",
			label: "Type",
			options: [
				{
					value: "determinate",
					label: "Determinate",
				},
				{
					value: "indeterminate",
					label: "Indeterminate",
				},
			],
		},
		{
			name: "shape",
			type: "SELECT",
			label: "Shape",
			options: [
				{
					value: "linear",
					label: "Linear",
				},
				{
					value: "circular",
					label: "Circular",
				},
			],
		},
		{
			name: "progress",
			type: "NUMBER",
			label: "Progress",
			display: [
				{
					property: "type",
					value: "determinate",
					type: "EQUALS",
				},
			],
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "INTERACTION",
}
export { ProgressProps, ProgressDefinition }

export default ProgressPropertyDefinition
