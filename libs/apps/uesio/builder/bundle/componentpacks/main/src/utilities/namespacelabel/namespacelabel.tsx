import { FC } from "react"
import { definition, hooks, component } from "@uesio/ui"

const IconLabel = component.getUtility("uesio/builder.iconlabel")

interface T extends definition.UtilityProps {
	metadatakey: string // This can either be 'uesio/crm' or a full key like 'uesio/crm.name'
	title?: string
}

const NamespaceLabel: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const { metadatakey = "", title, context, classes } = props
	const [ns, name] = metadatakey.split(".")
	const nsInfo = uesio.builder.getNamespaceInfo(ns, context)

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
