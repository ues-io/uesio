import { css } from "@emotion/css"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"

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

export { getComponentTypePropsDef, getFieldPropsDef }
