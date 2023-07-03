import { useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"

type AppIconPickerDefinition = {
	fieldId: string
	colorFieldId: string
}

const APP_ICONS = [
	"circle",
	"change_history",
	"square",
	"pentagon",
	"hexagon",
	"favorite",
	"shield",
	"cloud",
	"star",
	"science",
	"work",
	"key",
	"eco",
	"bolt",
	"database",
	"spa",
	"water_drop",
	"person",
	"psychology",
	"pets",
	"health_and_safety",
	"recycling",
	"coronavirus",
	"bug_report",
	"gesture",
	"palette",
	"shopping_cart",
	"monitoring",
	"insights",
	"payments",
	"restaurant",
	"music_note",
]

const getRandomIcon = () =>
	APP_ICONS[Math.floor(Math.random() * APP_ICONS.length)]

const StyleDefaults = Object.freeze({
	root: [
		"leading-none",
		"grid",
		"grid-cols-8",
		"cursor-pointer",
		"justify-items-left",
	],
	iconwrapper: [
		"inline-block",
		"rounded-full",
		"p-1",
		"border-[5px]",
		"transition-all",
		"border-transparent",
	],
	icon: ["text-[14pt]"],
})

const AppIconPicker: definition.UC<AppIconPickerDefinition> = (props) => {
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const Icon = component.getUtility("uesio/io.icon")
	const {
		context,
		definition: { fieldId, colorFieldId },
	} = props

	const record = context.getRecord()
	const wire = context.getWire()

	const iconValue = record?.getFieldValue(fieldId)
	const color = record?.getFieldValue(colorFieldId) as string

	useEffect(() => {
		if (!iconValue) {
			// Update to a random color if we haven't set one.
			record?.update(fieldId, getRandomIcon(), context)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fieldId, iconValue])

	if (!wire || !record) throw new Error("Record context not provided")

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)
	const colorFieldMetadata = collection.getField(colorFieldId)

	if (!fieldMetadata || !colorFieldMetadata)
		throw new Error("Invalid icon field or color field")

	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<FieldWrapper
			label={"Icon"}
			context={context}
			wire={wire}
			record={record}
			fieldId={fieldId}
		>
			<div className={classes.root}>
				{APP_ICONS.map((icon, index) => {
					const isSelected = iconValue === icon
					return (
						<div
							key={index}
							className={styles.process(
								undefined,
								classes.iconwrapper,
								isSelected && `border-[${color}]`,
								isSelected && `text-[${color}]`
							)}
							onClick={() => {
								record.update(fieldId, icon, context)
							}}
						>
							<Icon
								className={classes.icon}
								icon={icon}
								context={context}
							/>
						</div>
					)
				})}
			</div>
		</FieldWrapper>
	)
}

export default AppIconPicker
