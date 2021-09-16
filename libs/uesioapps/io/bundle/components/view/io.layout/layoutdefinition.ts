import { definition, builder, component } from "@uesio/ui"
import LayoutTemplateProp from "./layouttemplateprop"

type LayoutDefinition = {
	columnGap?: string
	justifyContent: string
	alignItems: string
	breakpoint: string
	columns: any[]
	template: number[]
}
interface LayoutProps extends definition.BaseProps {
	definition: LayoutDefinition
}

const spacingOptionsMap = [
	"center",
	"start",
	"end",
	"flex-start",
	"flex-end",
	"left",
	"right",
	"normal",
	"space-between",
	"space-around",
	"space-evenly",
	"stretch",
]

const spacingOptions = spacingOptionsMap.map((x) => ({ value: x, label: x }))

const LayoutPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Layout",
	description: "Layout",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		template: "1,1",
		columns: [
			{
				"io.column": {
					components: [],
				},
			},
			{
				"io.column": {
					components: [],
				},
			},
		],
	}),
	properties: [
		{
			type: "CUSTOM",
			name: "template",
			label: "Layout Template",
			renderFunc: LayoutTemplateProp,
		},
		{
			name: "alignItems",
			type: "SELECT",
			options: spacingOptions,
			label: "Align Items",
		},
		{
			name: "columnGap",
			type: "TEXT",
			label: "Column gap",
		},
		{
			name: "breakpoint",
			type: "TEXT",
			label: "Breakpoint",
		},
	],
	sections: [],
	actions: [],
	type: "component",
	traits: ["uesio.standalone"],
}
export { LayoutProps, LayoutDefinition }

export default LayoutPropertyDefinition
