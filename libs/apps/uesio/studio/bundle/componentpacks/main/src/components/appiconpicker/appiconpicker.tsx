import { FunctionComponent, useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"

type AppIconPickerDefinition = {
	fieldId: string
	colorFieldId: string
}

interface Props extends definition.BaseProps {
	definition: AppIconPickerDefinition
}

const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

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

const Icon = component.getUtility("uesio/io.icon")

const AppIconPicker: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, colorFieldId },
	} = props

	const record = context.getRecord()
	const wire = context.getWire()

	useEffect(() => {
		if (!iconValue && record) {
			// Update to a random color if we haven't set one.
			record.update(fieldId, getRandomIcon())
		}
	}, [])

	if (!wire || !record) throw new Error("Record context not provided")

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)
	const colorFieldMetadata = collection.getField(colorFieldId)

	if (!fieldMetadata || !colorFieldMetadata)
		throw new Error("Invalid icon field or color field")

	const iconValue = record.getFieldValue(fieldId)

	const color = record.getFieldValue(colorFieldId) as string

	const classes = styles.useStyles(
		{
			root: {
				lineHeight: 0,
				display: "grid",
				gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
				gridTemplateRows: "36px 36px 36px 36px",
				columnGap: "4px",
				cursor: "pointer",
				justifyItems: "center",
				alignItems: "center",
			},
			iconwrapper: {
				display: "inline-block",
				borderRadius: "20px",
				color: "#555",
				padding: "4px",
				transition: "all 0.2s ease-in",
				borderWidth: "0px",
				borderStyle: "solid",
				borderColor: color,
			},
			icon: {
				fontSize: "14pt",
			},
			selected: {
				borderWidth: "5px",
				color,
			},
		},
		props
	)

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
							className={styles.cx(classes.iconwrapper, {
								[classes.selected]: isSelected,
							})}
							onClick={() => {
								record.update(fieldId, icon)
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
