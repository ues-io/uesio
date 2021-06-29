import { FC, useEffect, useState } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import KeyValueList, { List } from "../KeyValueList"
import { hooks, styles, component } from "@uesio/ui"

// Couldn't find another fix
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import * as T from "../../../../../../ui/src/buildmode/buildpropdefinition"
const FieldLabel = component.registry.getUtility("io.fieldlabel")

type StylingObjectForInput = {
	className: string
	values: List
}

const MetadataListProp: FC<PropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const descriptor = props.descriptor as T.MetadataListProp
	const { getValue, context, path, definition } = props

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

	// Save value so we're not running the function everytime from the .map below
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

	const classes = styles.useStyles(
		{
			inlineStylesInput: {
				marginBottom: "1em",
			},
		},
		props
	)

	return (
		<div>
			<FieldLabel label={"Inline Styles"} context={context} />
			{descriptor.classes.map((className, i) => (
				<div className={classes.inlineStylesInput}>
					<span>.{className}</span>
					<KeyValueList
						onListUpdate={(list: List) =>
							handleUpdate(className, list)
						}
						context={context}
						value={
							sourceData.find(
								(item) => item.className === className
							)?.values || []
						}
					/>
				</div>
			))}
		</div>
	)
}

export default MetadataListProp
