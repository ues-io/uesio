import { component, builder, hooks, styles } from "@uesio/ui"
import { useState } from "react"

const TextField = component.getUtility("uesio/io.textfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
const IconButton = component.getUtility("uesio/io.iconbutton")

const ComponentIdProp: builder.PropComponent<builder.ComponentIdProp> = (
	props
) => {
	const { descriptor, valueAPI, context, path } = props

	if (!path) return null
	const uesio = hooks.useUesio(props)
	const componentType = component.path.getKeyAtPath(
		component.path.getParentPath(path)
	)
	if (!componentType) return null
	const allComponents = uesio.component.useAllComponents()

	const [id, setId] = useState(valueAPI.get(path))
	const [exists, setExists] = useState(false)

	const checkId = (value: string) => {
		const componentId = uesio.component.makeComponentId(
			context,
			componentType,
			value
		)

		const exists = allComponents.some(
			(component) => component.id === componentId
		)

		setExists(exists)
		setId(value)
	}

	const classes = styles.useUtilityStyles(
		{
			wrapper: {
				display: "grid",
				gridTemplateColumns: "1fr min-content",
				alignItems: "center",
				columnGap: "8px",
			},
		},
		null
	)

	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/builder.propfield"
			errors={
				exists
					? [{ message: "Component ID already exists in this view" }]
					: []
			}
		>
			<div className={classes.wrapper}>
				<TextField
					variant="uesio/io.field:uesio/builder.propfield"
					value={id}
					setValue={(value: string) => checkId(value)}
					context={context}
				/>
				<IconButton
					context={context}
					label="Change ID"
					icon={"done"}
					disabled={exists}
					onClick={() => valueAPI.set(path, id)}
				/>
			</div>
		</FieldWrapper>
	)
}

export default ComponentIdProp
