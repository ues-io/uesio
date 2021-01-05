import React, { FunctionComponent, SyntheticEvent } from "react"

import { hooks, material } from "@uesio/ui"
import { BreadcrumbsProps } from "./breadcrumbsdefinition"

const useStyles = material.makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
}))

const Breadcrumbs: FunctionComponent<BreadcrumbsProps> = (props) => {
	const classes = useStyles()
	const uesio = hooks.useUesio(props)
	const crumbs = props.definition?.crumbs

	return (
		<material.Breadcrumbs className={classes.root}>
			{crumbs?.map?.((crumbDef, index) => {
				const text = props.context.merge(crumbDef.text)
				const href = props.context.merge(crumbDef.href)
				const url = href && !href.startsWith("/") ? `/${href}` : href
				if (crumbDef.href) {
					const onClick = (event: SyntheticEvent): void => {
						event.preventDefault()
						crumbDef.signals &&
							uesio.signal.getHandler(crumbDef.signals)()
					}
					return (
						<material.Link href={url} onClick={onClick}>
							{text}
						</material.Link>
					)
				}
				return (
					<material.Typography key={index}>
						{text}
					</material.Typography>
				)
			}) || []}
		</material.Breadcrumbs>
	)
}

export default Breadcrumbs
