import { FC } from "react"
import { definition, styles, hooks, component } from "@uesio/ui"

const Text = component.getUtility("uesio/io.text")

interface T extends definition.UtilityProps {
	metadatakey: string // This can either be 'uesio/crm' or a full key like 'uesio/crm.name'
	title?: string
}

const NamespaceLabel: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const [ns, name] = props.metadatakey.split(".")
	const { icon, color } = uesio.builder.getNamespaceInfo(ns)

	const classes = styles.useUtilityStyles(
		{
			root: {},
			icon: {},
			title: {},
		},
		props
	)
	return (
		<div className={classes.root}>
			<Text
				variant="uesio/io.icon"
				text={icon}
				color={color}
				classes={{
					root: classes.icon,
				}}
				context={props.context}
			/>
			<Text
				text={" " + props.title || name}
				context={props.context}
				classes={{
					root: classes.title,
				}}
			/>
		</div>
	)
}

export default NamespaceLabel
