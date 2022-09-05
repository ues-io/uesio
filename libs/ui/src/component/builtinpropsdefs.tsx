import { css } from "@emotion/css"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { getComponents } from "./registry"

const getComponentTypePropsDef = (
	compPropsDef: BuildPropertiesDefinition
): BuildPropertiesDefinition => ({
	title: compPropsDef.title,
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "description",
			type: "CUSTOM",
			label: "Description",
			renderFunc: () => (
				<div
					className={css({
						fontSize: "10pt",
						marginBottom: "8px",
					})}
				>
					<div>{compPropsDef.description}</div>
					<a href={compPropsDef.link} target="blank">
						{compPropsDef.link}
					</a>
				</div>
			),
		},
	],
	sections: [],
})

const getPanelPropsDef = (): BuildPropertiesDefinition => {
	const componentList = getComponents("uesio.panel")
	return {
		title: "Panel",
		defaultDefinition: () => ({}),
		properties: [
			{
				name: "name",
				type: "KEY",
				label: "Panel Id",
			},
			{
				type: "SELECT",
				name: "uesio.type",
				label: "Panel Component",
				options: Object.entries(componentList).flatMap(([ns, nsdata]) =>
					Object.entries(nsdata).map(([comp]) => ({
						value: `${ns}.${comp}`,
						label: `${ns}.${comp}`,
					}))
				),
			},
		],
		type: "panel",
		sections: [],
	}
}

const getWirePropsDef = (): BuildPropertiesDefinition => ({
	title: "Wire",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "name",
			type: "KEY",
			label: "Name",
		},
		{
			name: "collection",
			type: "METADATA",
			metadataType: "COLLECTION",
			label: "Collection",
		},
		{
			name: "batchsize",
			type: "NUMBER",
			label: "Batch Size",
		},
	],
	sections: [
		{
			title: "Fields",
			type: "FIELDS",
		},
		{
			title: "Conditions",
			type: "CONDITIONS",
		},
		{
			title: "Order by",
			type: "ORDER",
		},
	],
	actions: [],
	type: "wire",
})

const getFieldPropsDef = (
	name: string,
	namespace: string,
	collectionNamespace: string,
	collectionName: string
) => ({
	title: name,
	sections: [],
	defaultDefinition: () => ({}),
	traits: [
		"uesio.field",
		"wire." + collectionNamespace + "." + collectionName,
	],
	namespace,
	name,
})

const getParamPropsDef = (): BuildPropertiesDefinition => ({
	title: "Parameter",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "name",
			type: "KEY",
			label: "Name",
		},
		{
			name: "required",
			type: "BOOLEAN",
			label: "Required",
		},
		{
			name: "type",
			type: "SELECT",
			label: "Parameter Type",
			options: [
				{
					label: "Record ID",
					value: "RECORD",
				},
				{
					label: "Text",
					value: "TEXT",
				},
			],
		},
		{
			name: "collection",
			type: "METADATA",
			metadataType: "COLLECTION",
			label: "Collection",
			display: [
				{
					property: "type",
					value: "recordId",
				},
			],
		},
		{
			name: "defaultValue",
			type: "TEXT",
			label: "Default Value",
			display: [
				{
					property: "type",
					value: "text",
				},
			],
		},
	],
	sections: [],
	actions: [],
	type: "param",
})

export {
	getComponentTypePropsDef,
	getWirePropsDef,
	getFieldPropsDef,
	getPanelPropsDef,
	getParamPropsDef,
}
