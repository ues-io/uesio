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

	sections: [],
	traits: [],
	classes: ["root"],
	type: "component",
	actions: [],
	getFlexStyles: (
		input: React.ReactChild | builder.BuildPropertiesDefinition
	): React.CSSProperties | null => {
		// Get the definition from the children if called in Buildwrapper
		const definition = React.isValidElement(input)
			? input.props.definition
			: input

		if (!definition) {
			console.warn(
				"No valid inputs received to create flex styles",
				input
			)
			return null
		}
		const { flexRatio, minWidth, order } = definition

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
