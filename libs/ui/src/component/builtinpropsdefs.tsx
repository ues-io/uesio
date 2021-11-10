import { css } from "@emotion/css"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseVariantKey } from "./path"

const getComponentVariantPropsDef = (
	compPropsDef: BuildPropertiesDefinition,
	metadataItem: string
): BuildPropertiesDefinition => {
	const [componentNamespace, componentName, variantNamespace, variantName] =
		parseVariantKey(metadataItem)

	return {
		title: compPropsDef.title,
		defaultDefinition: () => ({}),
		properties: [
			{
				name: "uesio.styles",
				type: "STYLESLIST",
				label: "Variant",
			},
		],
		sections: [],
		readOnly: true,
		classes: compPropsDef.classes,
	}
}

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
	readOnly: true,
})

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
			name: "type",
			type: "SELECT",
			label: "Wire Type",
			options: [
				{
					label: "Create",
					value: "CREATE",
				},
				{
					label: "Read",
					value: "",
				},
			],
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
	actions: [
		{
			type: "LOAD_WIRE",
			label: "Refresh Wire",
		},
	],
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

export {
	getComponentTypePropsDef,
	getWirePropsDef,
	getFieldPropsDef,
	getComponentVariantPropsDef,
}
