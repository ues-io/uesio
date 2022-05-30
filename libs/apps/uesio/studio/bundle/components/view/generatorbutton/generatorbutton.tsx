import { FunctionComponent, useState } from "react"
import { hooks, definition, component, wire, context as ctx } from "@uesio/ui"

type GeneratorButtonDefinition = {
	generator: string
	label: string
}

interface Props extends definition.BaseProps {
	definition: GeneratorButtonDefinition
}

const Button = component.registry.getUtility("uesio/io.button")
const Dialog = component.registry.getUtility("uesio/io.dialog")
const Form = component.registry.getUtility("uesio/io.form")

const WIRE_NAME = "paramData"

const GeneratorButton: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const { label, generator } = definition
	const uesio = hooks.useUesio(props)
	const [genNamespace, genName] = component.path.parseKey(generator)

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const [open, setOpen] = useState<boolean>(false)

	const params = uesio.bot.useParams(
		context,
		genNamespace,
		genName,
		"generator"
	)

	uesio.wire.useDynamicWire(open ? WIRE_NAME : "", {
		viewOnly: true,
		fields: uesio.wire.getFieldsFromParams(params),
		init: {
			create: true,
		},
	})

	return (
		<>
			<Button
				context={context}
				variant="uesio/io.secondary"
				label={label}
				onClick={() => setOpen(true)}
			/>
			{open && (
				<component.Panel key="generatorpanel" context={context}>
					<Dialog
						context={context}
						width="400px"
						height="500px"
						onClose={() => setOpen(false)}
						title="Set Generator Parameters"
					>
						<Form
							wire={WIRE_NAME}
							context={context}
							submitLabel="Generate"
							onSubmit={async (record: wire.WireRecord) => {
								await uesio.bot.callGenerator(
									context,
									genNamespace,
									genName,
									uesio.wire.getParamValues(params, record)
								)
								setOpen(false)
								return uesio.signal.run(
									{
										signal: "route/RELOAD",
									},
									new ctx.Context()
								)
							}}
						/>
					</Dialog>
				</component.Panel>
			)}
		</>
	)
}

export default GeneratorButton
