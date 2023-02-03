import { FunctionComponent, useState } from "react"
import {
	api,
	param,
	definition,
	component,
	wire,
	context as ctx,
} from "@uesio/ui"

type GeneratorButtonDefinition = {
	generator: string
	label: string
}

interface ButtonProps extends definition.BaseProps {
	definition: GeneratorButtonDefinition
}

interface FormProps {
	generator: string
	setOpen: (value: boolean) => void
}

const getLayoutFieldFromParamDef = (def: param.ParamDefinition) => {
	switch (def.type) {
		case "METADATA":
			return {
				"uesio/studio.metadatafield": {
					fieldId: def.name,
					metadataType: def.metadataType,
					grouping: def.grouping,
				},
			}
		case "METADATAMULTI":
			return {
				"uesio/studio.multimetadatafield": {
					fieldId: def.name,
					metadataType: def.metadataType,
					grouping: def.grouping,
				},
			}
		default:
			return {
				"uesio/io.field": {
					fieldId: def.name,
				},
			}
	}
}

const GeneratorForm: definition.UtilityComponent<FormProps> = (props) => {
	const { context, generator, setOpen } = props

	const [genNamespace, genName] = component.path.parseKey(generator)

	const Dialog = component.getUtility("uesio/io.dialog")
	const DynamicForm = component.getUtility("uesio/io.dynamicform")

	const [params] = api.bot.useParams(
		context,
		genNamespace,
		genName,
		"generator"
	)

	if (!params) return null

	return (
		<component.Panel>
			<Dialog
				context={context}
				width="400px"
				height="500px"
				onClose={() => setOpen(false)}
				title="Set Generator Parameters"
			>
				<DynamicForm
					context={context}
					content={params.map((def) =>
						getLayoutFieldFromParamDef(def)
					)}
					fields={api.wire.getWireFieldsFromParams(params)}
					submitLabel="Generate"
					onSubmit={async (record: wire.WireRecord) => {
						await api.bot.callGenerator(
							context,
							genNamespace,
							genName,
							api.wire.getParamValues(params, record)
						)
						setOpen(false)
						return api.signal.run(
							{
								signal: "route/RELOAD",
							},
							new ctx.Context()
						)
					}}
				/>
			</Dialog>
		</component.Panel>
	)
}

const GeneratorButton: FunctionComponent<ButtonProps> = (props) => {
	const Button = component.getUtility("uesio/io.button")

	const { context, definition } = props
	const { label, generator } = definition

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const [open, setOpen] = useState<boolean>(false)

	return (
		<>
			<Button
				context={context}
				variant="uesio/io.secondary"
				label={label}
				onClick={() => setOpen(true)}
			/>
			{open && (
				<GeneratorForm
					setOpen={setOpen}
					generator={generator}
					context={context}
				/>
			)}
		</>
	)
}

export default GeneratorButton
