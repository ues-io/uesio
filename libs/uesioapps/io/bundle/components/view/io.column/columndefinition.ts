import { definition, builder, signal } from "@uesio/ui"
import React from "react"
type ColumnDefinition = {
	flexRatio: string | number
	minWidth: number
	order: number
}

interface ColumnProps extends definition.BaseProps {
	definition: ColumnDefinition
}

const ColumnPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Column",
	description: "Visible impression obtained by a camera",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		flexRatio: 1,
	}),

	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [
				{
					name: "flexRatio",
					type: "TEXT",
					label: "flex",
				},
				{
					name: "minWidth",
					type: "TEXT",
					label: "minWidth",
				},
				{
					name: "order",
					type: "TEXT",
					label: "Order",
				},
			],
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	getFlexStyles: (
		children?: React.ReactChild
	): React.CSSProperties | null => {
		if (!React.isValidElement(children) || !children.props.definition)
			return null
		const { flexRatio, minWidth, order } = children.props.definition

		const flex = flexRatio || "initial"
		const defFlexBasis = minWidth || "0%"
		// Stick 'px' behind if the value only contains numbers
		const flexBasis = `${defFlexBasis} ${
			new RegExp(/^\d+$/).test(defFlexBasis) ? "px" : ""
		}`

		return {
			flexGrow: flex,
			flexShrink: flex,
			flexBasis,
			order,
		}
	},
}
export { ColumnProps }

export default ColumnPropertyDefinition
