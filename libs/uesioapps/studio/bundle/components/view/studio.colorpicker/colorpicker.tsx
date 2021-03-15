import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"
import clsx from "clsx"

const COLORS = [
	"#003f5c",
	"#2f4b7c",
	"#665191",
	"#a05195",
	"#d45087",
	"#f95d6a",
	"#ff7c43",
	"#ffa600",
]

type ColorPickerDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: ColorPickerDefinition
}

const useStyles = styles.getUseStyles(["root", "color", "selected"], {
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
})

const ColorPicker: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId },
	} = props
	const classes = useStyles(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)

	const mode = context.getFieldMode() || "READ"

	if (!fieldMetadata) return null

	return (
		<div className={classes.root}>
			{COLORS.map((color) => {
				const isSelected = record.getFieldValue(fieldId) === color
				const isReadMode = mode === "READ"
				if ((isReadMode && isSelected) || !isReadMode) {
					return (
						<div
							key={color}
							className={clsx(classes.color, {
								[classes.selected]: isSelected,
							})}
							onClick={() => record.update(fieldId, color)}
							style={{ backgroundColor: color }}
						/>
					)
				}
				return null
			})}
		</div>
	)
}

export default ColorPicker
