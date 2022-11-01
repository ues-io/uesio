import { hooks, builder, component } from "@uesio/ui"
import SelectProp from "../selectprop/selectprop"

const BotProp: builder.PropComponent<builder.BotProp> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, descriptor, valueAPI } = props
	const botType = descriptor.botType

	const namespacePath = component.path.parseRelativePath(
		descriptor.namespacePath || "",
		props.path || ""
	)
	const namespace = valueAPI.get(namespacePath) as string
	if (!namespace) return null

	const [metadata] = uesio.builder.useMetadataList(
		context,
		"BOT",
		namespace,
		botType
	)

	return (
		<SelectProp
			{...props}
			descriptor={{
				...descriptor,
				type: "SELECT",
				label: "Bot",
				options: Object.keys(metadata || {}).map((key) => {
					const label = key.split(namespace + ".")[1] || key
					return {
						value: key,
						label,
					}
				}),
			}}
		/>
	)
}

export default BotProp
