import { api, builder } from "@uesio/ui"
import SelectProp from "../selectprop/selectprop"

const BotProp: builder.PropComponent<builder.BotProp> = (props) => {
	const { context, descriptor } = props
	const botType = descriptor.botType
	const namespace = descriptor.namespace
	if (!namespace) return null

	const [metadata] = api.builder.useMetadataList(
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
