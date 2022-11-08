import { builder, collection } from "@uesio/ui"

const valueSourceProps = [
	{
		name: "lookupWire",
		type: "WIRE",
		label: "Lookup Wire",
		display: [
			{
				property: "valueSource",
				value: "LOOKUP",
			},
		],
	},
	{
		name: "lookupField",
		type: "FIELD",
		label: "Lookup Field",
		wireField: "lookupWire",
		display: [
			{
				property: "valueSource",
				value: "LOOKUP",
			},
		],
	},
	{
		name: "param",
		type: "PARAM",
		label: "Param",
		display: [
			{
				property: "valueSource",
				value: "PARAM",
			},
		],
	},
	{
		name: "type",
		type: "SELECT",
		label: "Type",
		options: [
			{
				label: "Group",
				value: "GROUP",
			},
		],
		display: [
			{
				property: "type",
				value: "GROUP",
			},
		],
	},
	{
		name: "conjunction",
		type: "SELECT",
		label: "Conjunction",
		options: [
			{
				label: "AND",
				value: "AND",
			},
			{
				label: "OR",
				value: "OR",
			},
		],
		display: [
			{
				property: "type",
				value: "GROUP",
			},
		],
	},
] as builder.PropDescriptor[]

function getBaseProps(collectionName: string): builder.PropDescriptor[] {
	return [
		{
			name: "id",
			type: "TEXT",
			label: "Id",
		},
		{
			name: "field",
			type: "METADATA",
			metadataType: "FIELD",
			label: "Field",
			groupingValue: collectionName,
			display: [
				{
					type: "NOT_EQUALS",
					property: "type",
					value: "GROUP",
				},
			],
		},
		{
			name: "valueSource",
			type: "SELECT",
			label: "Value Source",
			options: [
				{
					label: "",
					value: "",
				},
				{
					label: "Value",
					value: "VALUE",
				},
				{
					label: "Lookup",
					value: "LOOKUP",
				},
				{
					label: "Param",
					value: "PARAM",
				},
			],
			display: [
				{
					type: "NOT_EQUALS",
					property: "type",
					value: "GROUP",
				},
			],
		},
	]
}

function getValueProp(
	field: collection.Field | undefined
	//conditionState: wire.WireConditionState
): builder.PropDescriptor {
	const selectOptions = field?.getSelectOptions()

	//This has to return a multiselect where the user defines the values on the fly
	//const isIn = conditionState && conditionState?.operator === "IN"

	const valueProperty: builder.PropDescriptor = selectOptions?.length
		? {
				name: "value",
				type: "MULTISELECT",
				label: "Values",
				options: selectOptions,
				display: [
					{
						property: "valueSource",
						value: "VALUE",
					},
				],
		  }
		: {
				name: "value",
				type: "TEXT",
				label: "Value",
				display: [
					{
						property: "valueSource",
						value: "VALUE",
					},
				],
		  }

	return valueProperty
}

function getOperatorProp(
	field: collection.Field | undefined
): builder.PropDescriptor {
	console.log(field)
	const fieldType = field?.getType()
	let baseOptions = [
		{
			label: "",
			value: "",
		},
		{
			label: "Equals",
			value: "EQ",
		},
		{
			label: "Not Equal To",
			value: "NOT_EQ",
		},
		{
			label: "Greater Than",
			value: "GT",
		},
		{
			label: "Less Than",
			value: "LT",
		},
		{
			label: "Greater Than or Equal To",
			value: "GTE",
		},
		{
			label: "Less Than or Equal To",
			value: "LTE",
		},
		//TO-DO we need more propertyes for this one
		// {
		// 	label: "In",
		// 	value: "IN",
		// },
		{
			label: "Is Blank",
			value: "IS_BLANK",
		},
		{
			label: "Is Not Blank",
			value: "IS_NOT_BLANK",
		},
	]

	if (fieldType === "MULTISELECT") {
		baseOptions = [
			...baseOptions,
			{
				label: "Has Any",
				value: "HAS_ANY",
			},
			{
				label: "Has All",
				value: "HAS_ALL",
			},
		]
	}

	return {
		name: "operator",
		type: "SELECT",
		label: "Operator",
		options: baseOptions,
		display: [
			{
				type: "NOT_BLANK",
				property: "valueSource",
			},
		],
	}
}

export { getBaseProps, valueSourceProps, getValueProp, getOperatorProp }
