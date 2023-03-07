import { definition, context, component } from "@uesio/ui"
import { get } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { ComponentProperty } from "../../properties/componentproperty"

type Definition = {
	propertyId: string
	path: FullPath
}

const getGrouping = (
	path: FullPath,
	context: context.Context,
	groupingPath?: string,
	groupingValue?: string
): string | undefined => {
	if (groupingValue) return groupingValue
	if (!groupingPath) return undefined

	const parsePath = component.path.parseRelativePath(
		groupingPath,
		path.localPath || ""
	)

	return get(context, path.setLocal(parsePath)) as string
}

const getFormFieldFromProperty = (
	property: ComponentProperty,
	context: context.Context,
	path: FullPath
) => {
	const { name, type, displayConditions } = property
	const baseFieldDef = {
		fieldId: name,
		"uesio.variant": "uesio/builder.propfield",
		"uesio.display": displayConditions,
		labelPosition: "left",
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
		case "LIST": {
			return property.items
				? {
						"uesio/builder.listproperty": {
							path,
							property,
						},
				  }
				: {
						"uesio/io.field": {
							fieldId: property.name,
							wrapperVariant: "uesio/io.minimal",
							displayAs: "DECK",
							labelPosition: "none",
							list: {
								components: property.components,
							},
						},
				  }
		}
		case "COMPONENT_ID": {
			return {
				"uesio/builder.keyfield": {
					...baseFieldDef,
					fieldId: "uesio.id",
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

	const property = properties.find(
		(property) => property.name === definition.propertyId
	)

	if (!property) return null

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
