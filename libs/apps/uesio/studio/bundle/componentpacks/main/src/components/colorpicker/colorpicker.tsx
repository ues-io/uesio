import { useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"

type ColorPickerDefinition = {
	fieldId: string
}

const StyleDefaults = Object.freeze({
	root: [
		"leading-none",
		"grid",
		"grid-cols-[repeat(16,_minmax(0,_1fr))]",
		"gap-1",
		"cursor-pointer",
		"m-2",
	],
	color: [
		"h-[13px]",
		"w-[13px]",
		"inline-block",
		"m-0.5",
		"rounded-sm",
		"transition-all",
	],
	selected: ["h-[17px]", "w-[17px]", "bg-white", "border-[5px]", "m-0"],
})

const ColorPicker: definition.UC<ColorPickerDefinition> = (props) => {
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const {
		context,
		definition: { fieldId },
	} = props
	const classes = styles.useStyleTokens(StyleDefaults, props)
	const record = context.getRecord()
	const wire = context.getWire()
	const colorValue = record?.getFieldValue(fieldId)

	useEffect(() => {
		if (!colorValue) {
			// Update to a random color if we haven't set one.
			record?.update(fieldId, styles.colors.getRandomColor(), context)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [colorValue, fieldId])

	if (!wire || !record) return null

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
				{styles.colors.MEDIUM_SHADES.map((shade) =>
					styles.colors.ACCENT_COLORS.map((color) => {
						const palette = styles.colors.COLORS[color]
						const hex = palette[shade]
						const isSelected = colorValue === hex
						return (
							<div
								key={`${color}-${shade}`}
								className={styles.process(
									undefined,
									classes.color,
									{
										[classes.selected]: isSelected,
									}
								)}
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
					})
				)}
			</div>
		</FieldWrapper>
	)
}

export default ColorPicker
