import { definition, builder, component } from "@uesio/ui"
import LayoutPresetProp from "./layoutpresetprop"

type LayoutDefinition = {
	columnGap?: string
	justifyContent: string
	alignItems: string
	columnGutterSize: string
	breakpoint: string
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
		columns: [
			{
				"io.column": {
					flexRatio: 1,
				},
			},
			{
				"io.column": {
					flexRatio: 1,
				},
			},
		],
	}),
	properties: [
		{
			type: "CUSTOM",
			name: "layoutPreset",
			label: "Layout Templates",
			renderFunc: LayoutPresetProp,
		},
		{
			name: "alignItems",
			type: "SELECT",
			options: spacingOptions,
			label: "Align Items",
		},
		{
			name: "columnGutterSize",
			type: "TEXT",
			label: "Column gutter",
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
