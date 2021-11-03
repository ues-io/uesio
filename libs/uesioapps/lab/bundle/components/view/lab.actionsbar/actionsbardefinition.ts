import { builder, signal } from "@uesio/ui"
const actions = ["Save", "Edit", "Delete", "Cancel"]

type ActionType = "save" | "delete" | "cancel" | "edit"

export type Action = {
	name: ActionType
	signals: signal.SignalDefinition[]
}
export type ActionsBarDefinition = {
	actions: ActionType[]
	actionsBarPosition: "top" | "bottom"
	actionsBarAlignment: "left" | "right"
	buttonVariant: string
	id?: string
}

export default (title: string) =>
	({
		title,
		type: "PROPLIST",
		properties: [
			{
				name: "buttonVariant",
				type: "METADATA",
				metadataType: "COMPONENTVARIANT",
				label: "Variant",
				groupingValue: "io.button",
			},
			{
				name: "actions",
				label: "Buttons",
				type: "MULTISELECT",
				options: actions.map((label) => ({
					value: label.toLowerCase(),
					label,
				})) as builder.PropertySelectOption[],
			},

			{
				name: "actionsBarPosition",
				type: "SELECT",
				label: "Position",
				options: [
					{
						value: "top",
						label: "Top",
					},
					{
						value: "bottom",
						label: "Bottom",
					},
				],
			},
			{
				name: "actionsBarAlignment",
				type: "SELECT",
				label: "Alignment",
				options: [
					{
						value: "left",
						label: "Left",
					},
					{
						value: "right",
						label: "Right",
					},
				],
			},
		],
	} as builder.PropertySection)
