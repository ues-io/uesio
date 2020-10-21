import React, { ReactElement } from "react"
import { definition, material } from "uesio"

type ColorPickerDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: ColorPickerDefinition
}

const useStyles = material.makeStyles(() => ({
	root: {
		margin: "8px",
		lineHeight: 0,
	},
	color: {
		height: "20px",
		width: "20px",
		display: "inline-block",
		margin: "4px 4px 4px 0",
	},
	selected: {
		height: "28px",
		width: "28px",
		margin: "0 4px 0 0",
	},
}))

const colors = [
	"#003f5c",
	"#2f4b7c",
	"#665191",
	"#a05195",
	"#d45087",
	"#f95d6a",
	"#ff7c43",
	"#ffa600",
]

function ColorPicker(props: Props): ReactElement | null {
	const classes = useStyles(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const fieldId = props.definition.fieldId
	const fieldMetadata = collection.getField(fieldId)

	const mode = props.context.getFieldMode() || "READ"

	if (!fieldMetadata.isValid()) {
		return null
	}

	return (
		<div className={classes.root}>
			{colors.map((color) => {
				const isSelected = record.getFieldValue(fieldId) === color
				const isReadMode = mode === "READ"
				if ((isReadMode && isSelected) || !isReadMode) {
					return (
						<div
							className={
								classes.color +
								(isSelected ? " " + classes.selected : "")
							}
							onClick={(): void => {
								record.update(fieldId, color)
							}}
							style={{
								backgroundColor: color,
							}}
						></div>
					)
				}
				return null
			})}
		</div>
	)
}

export default ColorPicker
