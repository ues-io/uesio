import { definition, context, component } from "@uesio/ui"
import { get } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { ComponentProperty } from "../../properties/componentproperty"
import { getProperty } from "../../helpers/propertiesform"

const { COMPONENT_ID } = component

type Definition = {
	propertyId: string
	path: FullPath
}

const parseRelativePath = (relativePath: string, basePath: string) => {
	// Clean strings starting with './', we don't need that
	const niceString = relativePath.startsWith("./")
		? relativePath.replace("./", "")
		: relativePath
	// get the N levels up the tree
	const arr = niceString.split("../")

	const startingPath = component.path.getAncestorPath(basePath, arr.length)
	const endingPath = arr
		.pop()
		?.split("/")
		.map((el) => `["${el}"]`)
		.join("")

	return startingPath + endingPath
}

const getGrouping = (
	path: FullPath,
	context: context.Context,
	groupingPath?: string,
	groupingValue?: string
): string | undefined => {
	if (groupingValue) return groupingValue
	if (!groupingPath) return undefined

	const parsePath = parseRelativePath(groupingPath, path.localPath || "")

	return get(context, path.setLocal(parsePath)) as string
}

export const getFormFieldFromProperty = (
	property: ComponentProperty,
	context: context.Context,
	path: FullPath
) => {
	const { name, type, displayConditions, readonly, label } = property
	const baseFieldDef = {
		fieldId: name,
		[COMPONENT_ID]: `property:${name}`,
		"uesio.variant": "uesio/builder.propfield",
		"uesio.display": displayConditions,
		labelPosition: "left",
		label,
		readonly,
	}
	switch (type) {
		case "METADATA":
		case "MULTI_METADATA":
			return {
				[`uesio/builder.${
					type === "METADATA" ? "" : "multi"
				}metadatafield`]: {
					...baseFieldDef,
					metadataType: property.metadataType,
					fieldWrapperVariant: "uesio/builder.propfield",
					grouping: getGrouping(
						path,
						context,
						property.groupingPath,
						property.groupingValue
					),
				},
			}
		case "NUMBER": {
			return {
				"uesio/io.field": {
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
					number: {
						step: property.step,
						max: property.max,
						min: property.min,
					},
				},
			}
		}
		case "MAP":
			return {
				"uesio/builder.mapproperty": {
					property,
					path,
				},
			}
		case "STRUCT":
			return {
				"uesio/builder.structproperty": {
					property,
					path,
				},
			}

		case "LIST": {
			//TO-DO ASK ZACH for this usecase
			//property.items ?
			return {
				"uesio/builder.listproperty": {
					path,
					property,
				},
			}
			// : {
			// 		"uesio/io.field": {
			// 			fieldId: property.name,
			// 			wrapperVariant: "uesio/io.minimal",
			// 			displayAs: "DECK",
			// 			labelPosition: "none",
			// 			list: {
			// 				components: property.components,
			// 			},
			// 		},
			//   }
		}
		case "COMPONENT_ID": {
			return {
				"uesio/builder.keyfield": {
					...baseFieldDef,
					fieldId: COMPONENT_ID,
					wrapperVariant: "uesio/builder.propfield",
				},
			}
		}
		case "KEY": {
			return {
				"uesio/builder.keyfield": {
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
				},
			}
		}
		case "WIRES":
		case "FIELDS": {
			return {
				"uesio/io.field": {
					...baseFieldDef,
					displayAs: "SELECT",
					wrapperVariant: "uesio/builder.propfield",
				},
			}
		}
		case "PARAMS": {
			return {
				"uesio/builder.paramsfield": {
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
					labelPosition: "none",
					viewIdField: property.viewProperty,
					viewComponentIdField: property.viewComponentIdProperty,
				},
			}
		}
		case "TEXT_AREA": {
			return {
				"uesio/io.field": {
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
					labelPosition: "top",
					longtext: {
						rows: 10,
					},
				},
			}
		}
		case "ICON": {
			return {
				"uesio/builder.iconprop": {
					path,
					property,
				},
			}
		}
		case "CONDITION": {
			return {
				"uesio/io.field": {
					...baseFieldDef,
					displayAs: "SELECT",
					wrapperVariant: "uesio/builder.propfield",
				},
			}
		}
		default:
			return {
				"uesio/io.field": {
					...baseFieldDef,
					placeholder: property.placeholder,
					wrapperVariant: "uesio/builder.propfield",
				},
			}
	}
}

const Property: definition.UC<Definition> = (props) => {
	const { context, path, definition } = props

	const componentData = context.getComponentData(
		"uesio/builder.propertiesform"
	)

	const properties = componentData.data.properties as ComponentProperty[]
	const propertiesPath = componentData.data.path as FullPath
	const property = getProperty(definition.propertyId, properties)

	// Ignore properties which should never be visually displayed
	// (e.g. a common use case for this is FIELD_METADATA properties)
	if (!property || property.display === false) return null

	return (
		<component.Slot
			definition={{
				content: [
					getFormFieldFromProperty(property, context, propertiesPath),
				],
			}}
			listName="content"
			path={path}
			context={context}
		/>
	)
}

export default Property
