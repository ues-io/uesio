import { FC, useState } from "react"
import { component, definition, builder } from "@uesio/ui"

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const ListField = component.registry.getUtility("io.listfield")

type StyleValue = {
	key: string
	value: string
}

const StylesListProp: FC<builder.PropRendererProps> = (props) => {
	const { context, path, propsDef, valueAPI } = props

	const styleData = valueAPI.get(path) as definition.DefinitionMap

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
		valueAPI.set(
			`${path}["${className}"]`,
			value.reduce(
				(obj, item) => ({
					...obj,
					[item.key]: item.value || "",
				}),
				{} as Record<string, StyleValue>
			)
		)
	}

	return (
		<div>
			{propsDef.classes?.map((className) => (
				<>
					{propsDef.classes && (
						<FieldLabel label={className} context={context} />
					)}
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
						fieldVariant="studio.propfield"
					/>
				</>
			))}
		</div>
	)
}

export default StylesListProp
