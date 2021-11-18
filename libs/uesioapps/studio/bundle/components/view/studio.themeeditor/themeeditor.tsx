import { FunctionComponent, useEffect, useState } from "react"
import { definition, hooks, styles, util } from "@uesio/ui"
import Palette from "./palette"

type ThemeEditorDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: ThemeEditorDefinition
}

const initialState = {
	spacing: 0,
	palette: {
		primary: "",
		secondary: "",
		error: "",
		warning: "",
		info: "",
		success: "",
	},
	variantOverrides: {},
}

const ThemeEditor: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition
	const wire = context.getWire()
	const record = context.getRecord()

	if (!wire || !fieldId || !record) {
		return null
	}

	const value = record.getFieldValue<string>(fieldId)

	useEffect(() => {
		const themeDef: styles.ThemeStateDefinition = util.yaml
			.parse(value)
			.toJSON()
		setState(themeDef)
	}, [])

	const [state, setState] =
		useState<styles.ThemeStateDefinition>(initialState)

	const changeColor = (label: string, color: string): void => {
		const newState = {
			...state,
			palette: {
				...state.palette,
				[label]: color,
			},
		}
		setState(newState)
		const doc = util.yaml.stringify(newState)
		record.update(fieldId, doc.toString())
	}

	return (
		<div style={{ display: "flex", gap: "1em" }}>
			{Object.entries(state.palette).map((item, index) => {
				const [label, color] = item
				return (
					<Palette
						key={index}
						label={label}
						color={color}
						context={context}
						setState={changeColor}
					/>
				)
			})}
		</div>
	)
}

export default ThemeEditor
