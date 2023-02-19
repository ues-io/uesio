import { FunctionComponent, useRef, useState } from "react"
import {
	api,
	param,
	definition,
	component,
	wire,
	context as ctx,
} from "@uesio/ui"
import { FloatingPortal } from "@floating-ui/react"
import {
	getParamValues,
	getWireFieldsFromParams,
} from "../previewbutton/previewbutton"

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
				"uesio/builder.metadatafield": {
					fieldId: def.name,
					metadataType: def.metadataType,
					grouping: def.grouping,
				},
			}
		case "METADATAMULTI":
			return {
				"uesio/builder.multimetadatafield": {
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
	const Group = component.getUtility("uesio/io.group")
	const Button = component.getUtility("uesio/io.button")

	const [params] = api.bot.useParams(
		context,
		genNamespace,
		genName,
		"generator"
	)

	const wireRef = useRef<wire.Wire | undefined>()

	if (!params) return null

	return (
		<FloatingPortal>
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
					fields={getWireFieldsFromParams(params)}
					submitLabel="Generate"
					wireRef={wireRef}
				/>
				<Group justifyContent="end" context={context}>
					<Button
						context={context}
						variant="uesio/io.primary"
						label="Generate"
						onClick={async () => {
							const result = wireRef.current?.getFirstRecord()
							if (!result) return
							await api.bot.callGenerator(
								context,
								genNamespace,
								genName,
								getParamValues(params, result)
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
				</Group>
			</Dialog>
		</FloatingPortal>
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
