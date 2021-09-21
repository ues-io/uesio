import { FC } from "react"
import { builder, component, definition, hooks, styles } from "@uesio/ui"

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const IOButton = component.registry.getUtility("io.button")

interface Props extends definition.UtilityProps {
	descriptor: builder.PropDescriptor
}
const LayoutTemplateProp: FC<Props> = (props) => {
	const valueAPI = props.valueAPI as any
	const uesio = hooks.useUesio(props)
	const { path: dirtyPath, context } = props
	const path = component.path.getParentPath(dirtyPath || "")
	const definition = valueAPI.get(path)
	const { wire, template } = definition

	const handler = () => {
		console.log({ path, definition })
		console.log("setting")
		const notificationText =
			"Pet Added ${newwire53.name} ${newwire53.animaltype}"

		const signals = [
			{ signal: "wire/SAVE", wires: [wire] },
			{
				signal: "notification/ADD",
				text: notificationText,
			},
			{ signal: "wire/EMPTY", wire },
			{ signal: "wire/CREATE_RECORD", wire },
		]

		console.log(
			component.path.fromPath([
				...component.path.toPath(path),
				"components",
			])
		)
		console.log(
			component.path.fromPath([
				...component.path.toPath(path),
				"template",
			]),
			template
		)
		// Set the columns def
		valueAPI.set(
			component.path.fromPath([
				...component.path.toPath(path),
				"template",
			]),
			`${template},100%`
		)
		valueAPI.add(
			component.path.fromPath([
				...component.path.toPath(path),
				"columns",
			]),
			{
				"io.column": {
					components: [
						{
							"io.button": {
								text: "Submit",
								signals,
							},
						},
					],
				},
			}
		)
	}
	return (
		<div>
			<FieldLabel label={props.descriptor.label} context={context} />
			<IOButton
				label={"insert"}
				onClick={() => handler()}
				context={context}
			/>
		</div>
	)
}
;[]

export default LayoutTemplateProp
