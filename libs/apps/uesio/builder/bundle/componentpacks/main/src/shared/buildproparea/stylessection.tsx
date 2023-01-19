import { FunctionComponent, useState } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder, component, definition } from "@uesio/ui"
import PropList from "../../utilities/proplist/proplist"

type StyleValue = {
	key: string
	value: string
}

const StylesSection: FunctionComponent<SectionRendererProps> = (props) => {
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const ListField = component.getUtility("uesio/io.listfield")
	const { path, context, propsDef } = props

	//const stylesPath = `${path}["uesio.styles"]`
	const styleData = {} as definition.DefinitionMap
	const componentType = component.path.getKeyAtPath(path || "")

	const [styleError, setStyleError] = useState<Record<string, StyleValue[]>>()

	const getStyleValue = (className: string) => {
		const data = styleData?.[className] as definition.DefinitionMap
		if (!data) return []
		if (styleError?.[className]) {
			return styleError[className]
		}
		return Object.keys(data).map((key) => ({
			key,
			value: data[key],
		}))
	}

	const setStyleValue = (value: StyleValue[], className: string) => {
		// Check for a duplicate key
		const allKeys = value.map((el) => el.key)
		const hasDuplicates = new Set(allKeys).size !== allKeys.length

		if (hasDuplicates) {
			setStyleError({
				...styleError,
				...{
					[className]: value,
				},
			})
			return
		}
		// Clear out the style error if we don't have duplicates anymore
		if (styleError?.[className]) {
			const { [className]: value, ...newStyleError } = styleError
			setStyleError(newStyleError)
		}
		/*
		valueAPI.set(
			`${stylesPath}["${className}"]`,
			value.reduce(
				(obj, item) => ({
					...obj,
					[item.key]: item.value || "",
				}),
				{} as Record<string, StyleValue>
			)
		)
		*/
	}

	const properties: builder.PropDescriptor[] = [
		{
			name: "uesio.variant",
			type: "METADATA",
			metadataType: "COMPONENTVARIANT",
			label: "Variant",
			groupingValue: componentType || "",
		},
	]

	return (
		<>
			<PropList
				path={path}
				propsDef={propsDef}
				properties={properties}
				context={context}
			/>
			{propsDef.classes?.map((className) => (
				<>
					<TitleBar
						variant="uesio/builder.propsubsection"
						title={className}
						context={context}
					/>
					<ListField
						key={className}
						label={className}
						value={getStyleValue(className)}
						autoAdd
						subFields={[
							{ name: "key", label: "CSS Property" },
							{ name: "value", label: "Value" },
						]}
						subType="MAP"
						setValue={(value: StyleValue[]) =>
							setStyleValue(value, className)
						}
						mode="EDIT"
						context={context}
						variant="uesio/builder.propfield"
						labelVariant="uesio/builder.propfield"
						fieldVariant="uesio/io.field:uesio/builder.propfield"
					/>
				</>
			))}
		</>
	)
}

export default StylesSection
