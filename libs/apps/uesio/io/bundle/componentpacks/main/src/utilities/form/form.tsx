import { api, wire, definition, component } from "@uesio/ui"

import { Fragment, FunctionComponent } from "react"

interface FormProps extends definition.UtilityProps {
	wire?: string
	submitLabel?: string
	onSubmit?: (record: wire.WireRecord) => void
	content: definition.DefinitionList
}

const Button = component.getUtility("uesio/io.button")
const Group = component.getUtility("uesio/io.group")

const Form: FunctionComponent<FormProps> = (props) => {
	const { context, path, onSubmit, submitLabel, content } = props

	const wireName = props.wire
	const wire = api.wire.useWire(wireName, context)

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
					<Fragment key={record.getId()}>
						{content ? (
							<component.Slot
								definition={{
									content,
								}}
								listName="content"
								path={`${path}["content"]`}
								accepts={[]}
								direction="HORIZONTAL"
								context={recordContext}
							/>
						) : (
							wire.getFields().map((field) => (
								<component.Component
									key={record.getId() + field.id}
									componentType="uesio/io.field"
									definition={{
										fieldId: field.id,
									}}
									path={`${path}["${field.id}"]["${i}"]`}
									context={recordContext}
								/>
							))
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
					</Fragment>
				)
			})}
		</>
	)
}

export default Form
