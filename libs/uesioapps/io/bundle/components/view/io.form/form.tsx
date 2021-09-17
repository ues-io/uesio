import { FC } from "react"
import { component, styles, hooks } from "@uesio/ui"
import { FormProps } from "./formdefinition"

type ListMode = "READ" | "EDIT"

type ListState = {
	mode: ListMode
}

const IOLayout = component.registry.getUtility("io.layout")
const IOText = component.registry.getUtility("io.text")

const Form: FC<FormProps> = (props) => {
	const { definition, context, path } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	const classes = styles.useStyles(
		{
			root: {
				display: "block",
			},
		},
		props
	)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const handleSubmit = () => ({})

	const [componentState] = uesio.component.useState<ListState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	if (!wire) {
		console.warn("No wire matey")
		return <div />
	}

	const data = wire.getData()

	return (
		<div>
			<IOText
				classes={classes}
				variant={definition["uesio.variant"]}
				context={context}
				text={
					"Some text explaining why your fingers and toes get wrinkly in the shower but nothing else does?"
				}
				element={definition.element || "p"}
				color={definition.color}
				align={definition.align}
			/>

			{data.map((record) => (
				<component.Slot
					definition={definition}
					listName="components"
					path={path}
					accepts={["io.column"]}
					context={newContext.addFrame({
						record: record.getId(),
						fieldMode: componentState?.mode,
					})}
				/>
			))}
		</div>
	)
}

export default Form
