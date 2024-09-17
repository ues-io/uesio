import { definition, context, component } from "@uesio/ui"
import { get } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { ComponentProperty } from "../../properties/componentproperty"

const { COMPONENT_ID, DISPLAY_CONDITIONS, STYLE_VARIANT } = component

type Definition = {
	property: ComponentProperty
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
	const {
		defaultValue,
		displayConditions,
		label,
		name,
		placeholder,
		readonly,
		type,
	} = property
	const baseFieldDef = {
		fieldId: name,
		[COMPONENT_ID]: `property:${name}`,
		[STYLE_VARIANT]: "uesio/builder.propfield",
		[DISPLAY_CONDITIONS]: displayConditions,
		labelPosition: "left",
		label,
		readonly,
		placeholder: placeholder || defaultValue,
	}
	switch (type) {
		case "METADATA":
		case "MULTIMETADATA":
			return {
				"uesio/io.field": {
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
					metadata: property.metadata,
				},
			}
		case "COLLECTION_FIELD":
		case "COLLECTION_FIELDS":
			return {
				"uesio/builder.collectionfieldpicker": {
					...baseFieldDef,
					fieldWrapperVariant: "uesio/builder.propfield",
					collectionName: getGrouping(
						path,
						context,
						property.collectionPath,
						property.collectionName
					),
					allowReferenceTraversal: property.allowReferenceTraversal,
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
			return {
				"uesio/builder.listproperty": {
					path,
					property,
				},
			}
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
					applyChanges: "onTypingComplete",
					applyDelay: 100,
					wrapperVariant: "uesio/builder.propfield",
				},
			}
	}
}

const Property: definition.UC<Definition> = (props) => {
	const { context, path, definition } = props
	const { property, path: propertiesPath } = definition

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
export { getGrouping }
