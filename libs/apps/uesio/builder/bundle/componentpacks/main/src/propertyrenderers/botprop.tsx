import { api, definition } from "@uesio/ui"
import { FullPath } from "../api/path"
import SelectProp from "./selectprop"

interface BotProps {
	label: string
	path: FullPath
	botType: string
	namespace?: string
}

const BotProp: definition.UtilityComponent<BotProps> = (props) => {
	const { context, botType, namespace } = props
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
			label="Bot"
			options={Object.keys(metadata || {}).map((key) => {
				const label = key.split(namespace + ".")[1] || key
				return {
					value: key,
					label,
				}
			})}
		/>
	)
}

export default BotProp
