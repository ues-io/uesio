import {
	definition,
	component,
	api,
	metadata,
	signal,
	param,
	context,
	wire,
} from "@uesio/ui"
import { useEffect } from "react"
import { GeneratorForm as GeneratorFormUtility } from "../generatorbutton/generatorbutton"
import { getParamValues } from "../previewbutton/previewbutton"

type GeneratorFormDefinition = {
	generator: metadata.MetadataKey
}

type FormState = {
	params?: param.ParamDefinition[]
	namespace?: string
	name?: string
}

const run = async (
	namespace: string,
	name: string,
	wire: wire.Wire,
	params: param.ParamDefinition[],
	context: context.Context
) => {
	const result = wire.getFirstRecord()
	if (!result) return
	const botResp = await api.bot.callGenerator(
		context,
		namespace,
		name,
		getParamValues(params, context, result)
	)

	if (!botResp.success && botResp.error) {
		api.notification.addError(botResp.error, context.deleteWorkspace())
		return
	}

	api.signal.run(
		{
			signal: "route/NAVIGATE",
			path: `app/${context.getApp()}/workspace/${context.getWorkspace()?.name}`,
		},
		context.deleteWorkspace()
	)
}

const runGenerator: signal.ComponentSignalDescriptor<FormState> = {
	dispatcher: (state, signal, context, platform, id) => {
		const wire = context.getWire("dynamicwire:" + id)
		const params = state.params
		const name = state.name
		const namespace = state.namespace
		if (!wire || !params || !namespace || !name) return
		run(namespace, name, wire, params, context)
	},
}

const GeneratorForm: definition.UC<GeneratorFormDefinition> = (props) => {
	const { context, definition } = props
	const { generator } = definition

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const [genNamespace, genName] = component.path.parseKey(
		context.mergeString(generator)
	)

	const [params] = api.bot.useParams(
		context,
		genNamespace,
		genName,
		"generator"
	)

	const componentId = api.component.getComponentIdFromProps(props)
	useEffect(() => {
		api.component.setState<FormState>(componentId, {
			params,
			namespace: genNamespace,
			name: genName,
		})
	}, [componentId, params, genNamespace, genName])

	if (!params) return null

	return (
		<GeneratorFormUtility
			context={context}
			params={params}
			generator={componentId}
		/>
	)
}

GeneratorForm.signals = {
	RUN: runGenerator,
}

export default GeneratorForm
