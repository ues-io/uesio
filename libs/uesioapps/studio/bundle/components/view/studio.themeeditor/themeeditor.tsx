import { FunctionComponent, useEffect, useRef, useState } from "react"
import { definition, hooks, context, styles, util } from "@uesio/ui"
import Palette from "./palette"
import { lab } from "chroma-js"

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
	const uesio = hooks.useUesio(props)
	const wire = context.getWire()
	const record = context.getRecord()

	if (!wire || !fieldId || !record) {
		return null
	}

	const value = record.getFieldString(fieldId)

	useEffect(() => {
		const themeDef: styles.ThemeStateDefinition = util.yaml
			.parse(value)
			.toJSON()
		console.log("USEFF")
		setState(themeDef)
	}, [])

	const [state, setState] =
		useState<styles.ThemeStateDefinition>(initialState)

	const changeColor = (label: string, color: string): void => {
		console.log({ label, color })
		setState({
			...state,
			palette: {
				...state.palette,
				[label]: color,
			},
		})
		console.log("change color", state)

		//wire to YAML
		//const doc = util.yaml.newDoc()
		const doc = util.yaml.parse(JSON.stringify(state))
		record.update(fieldId, doc.toString())
	}

	return (
		<div>
			{Object.entries(state.palette).map((item, index) => {
				const [label, color] = item
				return (
					<Palette
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
