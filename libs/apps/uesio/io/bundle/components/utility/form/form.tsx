import { hooks, wire, definition, component } from "@uesio/ui"

import { FunctionComponent } from "react"

interface FormProps extends definition.UtilityProps {
	wire?: string
	submitLabel?: string
	onSubmit?: (record: wire.WireRecord) => void
}

const Button = component.registry.getUtility("uesio/io.button")
const Group = component.registry.getUtility("uesio/io.group")

const Form: FunctionComponent<FormProps> = (props) => {
	const { context, path, onSubmit, submitLabel } = props
	const uesio = hooks.useUesio(props)
	const wireName = props.wire
	const wire = uesio.wire.useWire(wireName)

	if (!wire) return null

	return (
		<>
			{wire.getData().map((record, i) => {
				const recordContext = context.addFrame({
					...(wireName && {
						wire: wireName,
					}),
					record: record.getId(),
					fieldMode: "EDIT",
				})
				// Loop over all the fields in the wire
				return (
					<>
						{Object.entries(wire.getFields()).map(
							([key, fieldDef]) => (
								<component.Component
									key={record.getId() + key}
									componentType="uesio/io.field"
									definition={{
										fieldId: key,
										placeholder: fieldDef?.placeholder,
									}}
									index={i}
									path={`${path}["${key}"]["${i}"]`}
									context={recordContext}
								/>
							)
						)}
						<Group
							styles={{
								root: {
									justifyContent: "end",
									marginTop: "10px",
								},
							}}
							context={context}
						>
							<Button
								context={context}
								variant="uesio/io.primary"
								label={submitLabel || "Save"}
								onClick={
									onSubmit
										? () => {
												onSubmit(record)
										  }
										: undefined
								}
							/>
						</Group>
					</>
				)
			})}
		</>
	)
}

export default Form
