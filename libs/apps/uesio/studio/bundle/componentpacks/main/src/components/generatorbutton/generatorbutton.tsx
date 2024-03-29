import { useRef, useState } from "react"
import {
	api,
	param,
	definition,
	component,
	hooks,
	wire,
	metadata,
} from "@uesio/ui"
import { FloatingPortal } from "@floating-ui/react"
import {
	getInitialValueFromParams,
	getParamValues,
	getWireFieldsFromParams,
} from "../previewbutton/previewbutton"

type GeneratorButtonDefinition = {
	generator: metadata.MetadataKey
	label: string
	buttonVariant?: metadata.MetadataKey
	hotkey?: string
}

interface FormProps {
	generator: metadata.MetadataKey
	setOpen: (value: boolean) => void
}

const getDisplayConditionsFromBotParamConditions = (
	conditions: param.ParamCondition[] = []
) => {
	if (!conditions || !conditions.length) return conditions
	return conditions.map(
		({ type = "fieldValue", operator, param, value, values }) => {
			if (type === "hasValue" || type === "hasNoValue") {
				return {
					type,
					value: "${" + param + "}",
				}
			} else {
				return {
					field: param,
					operator,
					type,
					value,
					values,
				}
			}
		}
	) as component.DisplayCondition[]
}

const getLayoutFieldFromParamDef = (def: param.ParamDefinition) => ({
	"uesio/io.field": {
		fieldId: def.name,
		"uesio.display": getDisplayConditionsFromBotParamConditions(
			def.conditions
		),
	},
})

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

	const onClick = async () => {
		const result = wireRef.current?.getFirstRecord()
		if (!result) return
		const botResp = await api.bot.callGenerator(
			context,
			genNamespace,
			genName,
			getParamValues(params, context, result)
		)

		if (!botResp.success && botResp.error) {
			api.notification.addError(botResp.error, context.deleteWorkspace())
			return
		}

		setOpen(false)
		return api.signal.run(
			{
				signal: "route/RELOAD",
			},
			context.deleteWorkspace()
		)
	}

	return (
		<FloatingPortal>
			<Dialog
				context={context}
				width="400px"
				height="500px"
				onClose={() => setOpen(false)}
				title="Set Generator Parameters"
				actions={
					<Group justifyContent="end" context={context}>
						<Button
							context={context}
							variant="uesio/io.primary"
							label="Generate"
							onClick={onClick}
						/>
					</Group>
				}
			>
				<DynamicForm
					context={context}
					content={params.map((def) =>
						getLayoutFieldFromParamDef(def)
					)}
					fields={getWireFieldsFromParams(params)}
					submitLabel="Generate"
					wireRef={wireRef}
					initialValue={getInitialValueFromParams(params)}
				/>
			</Dialog>
		</FloatingPortal>
	)
}

const GeneratorButton: definition.UC<GeneratorButtonDefinition> = (props) => {
	const Button = component.getUtility("uesio/io.button")

	const { context, definition } = props
	const {
		buttonVariant = "uesio/io.secondary",
		hotkey,
		label,
		generator,
	} = definition

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const [open, setOpen] = useState<boolean>(false)
	const onClick = () => setOpen(true)
	hooks.useHotKeyCallback(hotkey, onClick, true, [open])

	return (
		<>
			<Button
				context={context}
				variant={buttonVariant}
				label={label}
				onClick={onClick}
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

export { GeneratorForm }
export default GeneratorButton
