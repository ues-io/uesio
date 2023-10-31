import { component, definition, wire } from "@uesio/ui"
import { useSelectedPath } from "../../../../api/stateapi"

import PropertiesForm from "../../../../helpers/propertiesform"
import { ComponentProperty } from "../../../../properties/componentproperty"
import { useDefinition } from "../../../../api/defapi"
import { getHomeSection } from "../../../../api/propertysection"
import {
	DisplayConditionProperties,
	getDisplayConditionLabel,
} from "../../../../properties/displayconditionproperties"

const WireProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const wirePath = selectedPath.trimToSize(2)
	const [wireName] = wirePath.pop()

	// This forces a rerender if the definition changes
	const wireDefinition = useDefinition(wirePath) as wire.WireDefinition
	const VIEW_ONLY = !!(wireDefinition && wireDefinition.viewOnly)
	const IS_NOT_VIEW_ONLY = [
		{
			type: "hasNoValue",
			value: VIEW_ONLY,
		},
	] as component.DisplayCondition[]

	const properties: ComponentProperty[] = [
		// Wire Home properties
		{
			name: "wirename",
			label: "Wire Name",
			required: true,
			type: "KEY",
		},
		{
			name: "viewOnly",
			label: "View Only",
			type: "CHECKBOX",
			onChange: [
				{
					updates: [
						{
							field: "collection",
						},
						{
							field: "batchsize",
						},
						{
							field: "init",
						},
						{
							field: "order",
						},
						{
							field: "fields",
						},
						{
							field: "events",
						},
					],
				},
			],
		},
		{
			name: "collection",
			label: "Collection",
			required: true,
			type: "METADATA",
			metadataType: "COLLECTION",
			displayConditions: IS_NOT_VIEW_ONLY,
		},
		{
			name: "batchsize",
			label: "Batch Size",
			type: "NUMBER",
			displayConditions: IS_NOT_VIEW_ONLY,
		},
		{
			name: "init",
			label: "On initial View load...",
			type: "STRUCT",
			properties: [
				{
					name: "query",
					type: "CHECKBOX",
					label: "Query for Wire data",
					displayConditions: IS_NOT_VIEW_ONLY,
				},
				{
					name: "create",
					type: "CHECKBOX",
					label: "Create default record if Wire has none",
				},
			],
		},
		// Order section properties
		{
			name: "order",
			type: "LIST",
			items: {
				title: "Order By",
				addLabel: "New Order Field",
				displayTemplate: (order: { desc: boolean; field: string }) => {
					if (order.field) {
						return `${order.field} | ${
							order.desc ? "Descending" : "Ascending"
						}`
					}
					return "NEW_VALUE"
				},
				defaultDefinition: { desc: false },
				properties: [
					{
						name: "field",
						type: "COLLECTION_FIELD",
						label: "Field",
						// Currently Wire order fields can only be one level, on the same collection,
						// we don't support cross-collection ordering
						allowReferenceTraversal: false,
						collectionPath: "../collection",
					},
					{
						name: "desc",
						type: "CHECKBOX",
						label: "Descending",
					},
				],
			},
		},
		// Events section properties
		{
			name: "events",
			type: "LIST",
			items: {
				title: "Wire Event Handlers",
				addLabel: "New Wire Event Handler",
				displayTemplate: (event: {
					type: string
					fields?: string[]
				}) => {
					if (event.type) {
						return `${event.type}${
							event.fields?.length
								? ` | ${event.fields.join(", ")}`
								: ""
						}`
					}
					return "[No Type]"
				},
				defaultDefinition: { type: "onChange" },
				properties: [
					{
						name: "type",
						type: "SELECT",
						options: [
							{
								value: "onChange",
								label: "Wire Field(s) changed",
							},
							{
								value: "onLoadSuccess",
								label: "Wire loaded (successfully)",
							},
							{
								value: "onLoadError",
								label: "Wire loaded (with errors)",
							},
							{
								value: "onSaveSuccess",
								label: "Wire saved (successfully)",
							},
							{
								value: "onSaveError",
								label: "Wire saved (with errors)",
							},
							{
								value: "onCancel",
								label: "Wire changes cancelled",
							},
						],
						label: "Event Type",
					},
					{
						name: "fields",
						type: "FIELDS",
						wireName,
						label: "Fields",
						displayConditions: [
							{
								field: "type",
								value: "onChange",
								operator: "EQUALS",
							},
						] as component.DisplayCondition[],
					},
					{
						name: "conditions",
						type: "LIST",
						items: {
							title: "Condition",
							addLabel: "Add Condition",
							displayTemplate: (record: wire.PlainWireRecord) =>
								getDisplayConditionLabel(
									record as component.DisplayCondition
								),
							defaultDefinition: { operator: "EQUALS" },
							properties: DisplayConditionProperties,
						},
						displayConditions: [
							{
								field: "type",
								value: "onChange",
								operator: "EQUALS",
							},
						] as component.DisplayCondition[],
					},
				],
				sections: [
					{
						type: "CUSTOM",
						id: "wireeventhome",
						label: "",
						icon: "home",
						properties: ["type", "fields"],
					},
					{ type: "SIGNALS" },
					{
						type: "CUSTOM",
						id: "wireeventconditions",
						properties: ["conditions"],
						label: "Conditions",
					},
				],
			},
		},
	]

	return (
		<PropertiesForm
			title={wireName || ""}
			context={context}
			id="wireproperties"
			properties={properties}
			sections={[
				getHomeSection([
					"wirename",
					"viewOnly",
					"collection",
					"batchsize",
					"init",
				]),
				{
					id: "fields",
					label: "Fields",
					type: "CUSTOM",
					viewDefinition: [
						{
							"uesio/builder.fieldsproperties": {
								viewOnly: VIEW_ONLY,
							},
						},
					],
				},
				{
					id: "conditions",
					label: "Conditions",
					type: "CUSTOM",
					viewDefinition: [
						{
							"uesio/builder.conditionsproperties": {},
						},
					],
					displayConditions: IS_NOT_VIEW_ONLY,
				},
				{
					id: "order",
					label: "Order",
					type: "CUSTOM",
					properties: ["order"],
					displayConditions: IS_NOT_VIEW_ONLY,
				},
				{
					id: "events",
					label: "Events",
					type: "CUSTOM",
					properties: ["events"],
				},
			]}
			path={wirePath}
		/>
	)
}

WireProperties.displayName = "WireProperties"

export default WireProperties
