import { component, builder, hooks } from "@uesio/ui"
import { useState } from "react"

const TextField = component.getUtility("uesio/io.textfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
const Button = component.getUtility("uesio/io.button")

const ComponentProp: builder.PropComponent<builder.ComponentProp> = (props) => {
	const { descriptor, valueAPI, context, path } = props

	if (!path) return null
	const uesio = hooks.useUesio(props)
	const componentType = component.path.getKeyAtPath(
		component.path.getParentPath(path)
	)
	if (!componentType) return null
	const allComponents = uesio.component.useAllComponents()

	const [id, setId] = useState(valueAPI.get(path))

	const checkId = (value: string) => {
		const componentId = uesio.component.makeComponentId(
			context,
			componentType,
			value
		)

		const exists = allComponents.some(
			(component) => component.id === componentId
		)

		if (!exists) {
			setId(value)
		} else {
			uesio.signal.run(
				{
					signal: "notification/ADD",
					text: "Component ID already exists in this view",
					details: "Please chose another one",
					severity: "error",
				},

				context
			)
		}
	}

	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<TextField
				variant="uesio/io.field:uesio/builder.propfield"
				value={id}
				setValue={(value: string) => checkId(value)}
				context={context}
			/>
			<Button
				context={context}
				label="Set Id"
				onClick={() => valueAPI.set(path, id)}
			/>
		</FieldWrapper>
	)
}

export default ComponentProp
