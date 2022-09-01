import { FC } from "react"
import { definition, styles, hooks, component } from "@uesio/ui"

const Text = component.getUtility("uesio/io.text")
const Tooltip = component.getUtility("uesio/io.tooltip")

interface T extends definition.UtilityProps {
	metadatakey: string // This can either be 'uesio/crm' or a full key like 'uesio/crm.name'
	title?: string
}

const NamespaceLabel: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const { metadatakey = "", title, context } = props
	const [ns, name] = metadatakey.split(".")

	const nsInfo = uesio.builder.getNamespaceInfo(ns)

	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				gap: "5px",
				alignItems: "center",
			},
			icon: {},
			title: {},
		},
		props
	)
	return (
		<div className={classes.root}>
			{nsInfo && (
				<Tooltip text={ns} context={context}>
					<Text
						variant="uesio/io.icon"
						text={nsInfo.icon}
						color={nsInfo.color}
						classes={{
							root: classes.icon,
						}}
						context={context}
					/>
				</Tooltip>
			)}
			<Text
				text={title || name}
				context={props.context}
				classes={{
					root: classes.title,
				}}
			/>
		</div>
	)
}

export default NamespaceLabel
