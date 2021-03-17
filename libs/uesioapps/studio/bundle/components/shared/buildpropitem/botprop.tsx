import { FunctionComponent, useEffect } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, builder } from "@uesio/ui"
import SelectProp from "./selectprop"

interface BotPropRendererProps extends PropRendererProps {
	descriptor: builder.BotProp
}

const BotProp: FunctionComponent<BotPropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, descriptor } = props
	const botType = descriptor.botType
	const namespace = descriptor.namespace
	if (!namespace) return null

	const metadata = uesio.builder.useMetadataList("BOT", namespace, botType)

	useEffect(() => {
		if (!metadata) {
			uesio.builder.getMetadataList(context, "BOT", namespace, botType)
		}
	})

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
