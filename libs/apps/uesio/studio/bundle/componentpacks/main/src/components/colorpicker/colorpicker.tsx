import { FunctionComponent, useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"

type ColorPickerDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: ColorPickerDefinition
}

const ColorPicker: FunctionComponent<Props> = (props) => {
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const {
		context,
		definition: { fieldId },
	} = props
	const classes = styles.useStyles(
		{
			root: {
				lineHeight: 0,
				display: "grid",
				gridTemplateColumns: "1fr 1fr 1fr 1fr",
				gridTemplateRows: "1fr 1fr 1fr 1fr",
				gridAutoFlow: "column",
				columnGap: "4px",
				cursor: "pointer",
			},
			color: {
				height: "13px",
				width: "13px",
				display: "inline-block",
				margin: "2px",
				borderRadius: "20px",
				transition: "all 0.2s ease-in",
			},
			selected: {
				height: "17px",
				width: "17px",
				backgroundColor: "white",
				borderWidth: "5px",
				borderStyle: "solid",
				margin: "0px",
			},
		},
		props
	)
	const record = context.getRecord()
	const wire = context.getWire()

	useEffect(() => {
		if (!colorValue && record) {
			// Update to a random color if we haven't set one.
			record.update(fieldId, styles.colors.getRandomColor(), context)
		}
	}, [])

	if (!wire || !record) return null

	const colorValue = record.getFieldValue(fieldId)
	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	return (
		<FieldWrapper
			label={"Color"}
			context={context}
			wire={wire}
			record={record}
			fieldId={fieldId}
		>
			<div className={classes.root}>
				{styles.colors.ACCENT_COLORS.map((color, index) => {
					const palette = styles.colors.COLORS[color]
					return (
						<div key={index}>
							{styles.colors.MEDIUM_SHADES.map((shade) => {
								const hex = palette[shade]
								const isSelected = colorValue === hex
								return (
									<div
										key={`${color}-${shade}`}
										className={styles.cx(classes.color, {
											[classes.selected]: isSelected,
										})}
										onClick={() =>
											record.update(fieldId, hex, context)
										}
										style={{
											...(!isSelected && {
												backgroundColor: hex,
											}),
											...(isSelected && {
												borderColor: hex,
											}),
										}}
									/>
								)
							})}
						</div>
					)
				})}
			</div>
		</FieldWrapper>
	)
}

export default ColorPicker
