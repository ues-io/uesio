import { FC } from "react"
import { definition, component } from "@uesio/ui"
import { getBuilderNamespaces } from "../../api/stateapi"

const IconLabel = component.getUtility("uesio/builder.iconlabel")

interface T extends definition.UtilityProps {
	metadatakey: string // This can either be 'uesio/crm' or a full key like 'uesio/crm.name'
	title?: string
}

const NamespaceLabel: FC<T> = (props) => {
	const { metadatakey = "", title, context, classes } = props
	const [ns, name] = metadatakey.split(".")

	const nsInfo = getBuilderNamespaces(context)[ns]

	if (!nsInfo) return null

	return (
		<IconLabel
			tooltip={ns}
			color={nsInfo.color}
			icon={nsInfo.icon}
			text={title || name}
			context={context}
			classes={classes}
		/>
	)
}

export default NamespaceLabel
