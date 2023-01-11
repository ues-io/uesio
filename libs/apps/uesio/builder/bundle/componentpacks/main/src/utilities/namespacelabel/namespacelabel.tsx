import { definition } from "@uesio/ui"
import { getBuilderNamespaces } from "../../api/stateapi"
import IconLabel from "../iconlabel/iconlabel"

type NamespaceLabelProps = {
	metadatakey: string // This can either be 'uesio/crm' or a full key like 'uesio/crm.name'
	title?: string
}

const NamespaceLabel: definition.UtilityComponent<NamespaceLabelProps> = (
	props
) => {
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
