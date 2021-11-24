import { FC, useState, useEffect } from "react"
import { component, definition, builder } from "@uesio/ui"

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const ListField = component.registry.getUtility("io.listfield")

type StyleValue = {
	key: string
	value: string
}

const StylesListProp: FC<builder.PropRendererProps> = (props) => {
	const { context, path, propsDef, valueAPI } = props
	const [localStyleData, setX] =
		useState<{ [key: string]: definition.DefinitionList }[]>()

	const styleData = valueAPI.get(path) as definition.DefinitionMap

	const createKeyValuesArray = (data: Record<string, string> | undefined) => {
		if (!data) return []
		return Object.keys(data).reduce(
			(arr, key) => [...arr, { key, value: data[key] }],
			[]
		)
	}

	const writeStylesToYaml = (className: string, value: StyleValue[]) =>
		valueAPI.set(
			`${path}["${className}"]`,
			value.reduce(
				(
					obj: Record<string, string>,
					item: { key: string; value: string }
				) => ({
					...obj,
					[item.key]: item.value,
				}),
				{}
			)
		)

	// Sometimes we want to keep track of the styles internally before writing them to the yaml
	const getUpdateType = (value: StyleValue[]): "viewdef" | "local" => {
		const allKeys = value.map((el) => el.key)
		const hasDuplicates = new Set(allKeys).size !== allKeys.length
		if (hasDuplicates) return "local"

		const hasIncompleteProperties = value.some((v) => !v.key || !v.value)
		if (hasIncompleteProperties) return "local"

		return "viewdef"
	}

	const handleUpdate = (className: string, properties: StyleValue[]) => {
		const updateType = getUpdateType(properties)
		if (updateType === "viewdef")
			return writeStylesToYaml(className, properties)
		const newState = localStyleData?.map((classData) => {
			const name = Object.keys(classData)[0]

			if (name !== className) return classData
			return {
				[className]: properties,
			}
		})
		return setX(newState)
	}

	useEffect(() => {
		const styleLists = propsDef.classes?.map((className) => ({
			[className]: createKeyValuesArray(
				styleData?.[className] as Record<string, string> | undefined
			),
		}))
		if (!styleLists) return
		setX(styleLists)
	}, [styleData])

	return (
		<div>
			{propsDef.classes && (
				<FieldLabel label={"Inline Styles"} context={context} />
			)}
			{localStyleData &&
				localStyleData.map((classData, index) => {
					const className = Object.keys(classData)[0] as string
					const data = classData[className] as StyleValue[]

					if (!data) return null
					return (
						<ListField
							key={className}
							label={className}
							value={data}
							autoAdd
							subFields={[
								{
									name: "key",
								},
								{ name: "value" },
							]}
							subType="MAP"
							setValue={(value: StyleValue[]) => {
								handleUpdate(className, value)
							}}
							mode="EDIT"
							context={context}
						/>
					)
				})}
		</div>
	)
}

export default StylesListProp
