import { definition, metadata } from "@uesio/ui"
import IconLabel from "../iconlabel/iconlabel"

type NamespaceLabelProps = {
	metadatakey: string // This can either be 'uesio/crm' or a full key like 'uesio/crm.name'
	metadatainfo?: metadata.NamespaceInfo
	title?: string
}

const NamespaceLabel: definition.UtilityComponent<NamespaceLabelProps> = (
	props
) => {
	const { metadatakey = "", metadatainfo, title, context, classes } = props
	const [ns, name] = metadatakey.split(".")

	return (
		<IconLabel
			tooltip={ns}
			color={metadatainfo?.color || ""}
			icon={metadatainfo?.icon || ""}
			text={title || name}
			context={context}
			classes={classes}
		/>
	)
}

export default NamespaceLabel
