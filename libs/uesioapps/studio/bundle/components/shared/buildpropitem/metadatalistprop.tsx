import { FC, useEffect, useState } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import KeyValueList, { ListItem } from "../../KeyValueList"
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import * as T from "../../../../../../ui/src/buildmode/buildpropdefinition"
import { hooks, component, definition } from "@uesio/ui"

type StylingObjectForInput = {
	className: string
	values: { key: string; value: string }[]
}

type List = ListItem[]

const MetadataListProp: FC<PropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const descriptor = props.descriptor as T.MetadataListProp
	const { getValue, context, path, definition } = props

	// // {..., padding: '12px'} ==> [{key: 'padding', value: '12px'}]
	// const styleArray = (styleObject: KeyValueObject): KeyValueArray =>
	// 	Object.keys(styleObject).map((k) => ({ key: k, value: styleObject[k] }))

	const valuesFromSource = (): StylingObjectForInput[] => {
		if (!definition || !definition[`uesio.styles`]) return []
		// We could use getValue here but that gives some TS errors
		const stylesInDef = definition[`uesio.styles`]
		const classNames: string[] = Object.keys(stylesInDef)
		return classNames.reduce(
			(arr: StylingObjectForInput[], className: string) => {
				const keysAndValues = stylesInDef[className]

				return [
					...arr,
					{
						className,
						values: Object.keys(keysAndValues).map((k) => ({
							key: k,
							value: keysAndValues[k],
						})),
					},
				]
			},
			[]
		)
	}

	// save value so we're not rerunning the function everytime from the .map below
	const sourceData = valuesFromSource()

	const handleUpdate = (className: string, list: List = []) => {
		// 1. We need a way to format the style list for the Yaml Definition
		// [{key: 'padding', value: '12px'}] ==> {..., padding: '12px'}
		const styleDefinition = list.reduce(
			(obj, item) => ({
				...obj,
				[item.key]: item.value,
			}),
			{}
		)
		// 2. Save it to the def
		uesio.view.setDefinition(
			`${path}["${descriptor.name}"]["${className}"]`,
			styleDefinition
		)
	}

	return (
		<div>
			{descriptor.classes.map((className, i) => (
				<div>
					{/* TODO: get better component for label */}
					<span>{className}</span>
					<KeyValueList
						onListUpdate={(list: List) =>
							handleUpdate(className, list)
						}
						context={context}
						value={
							sourceData.find(
								(item) => item.className === className
							)?.values
						}
					/>
				</div>
			))}
		</div>
	)
}

export default MetadataListProp
