import React, { FC, SyntheticEvent } from "react"
import { UtilityPropsPlus } from "../definition/definition"

import { useUesio } from "../hooks/hooks"

type T = {
	error: Error | null
	componentProps: UtilityPropsPlus
	cname?: string
}
// const Icon = getUtility("uesio/io.icon")
const slotError: FC<T> = ({ error, componentProps, cname }) => {
	console.log({ cname })
	const uesio = useUesio(componentProps)
	const viewDefId = uesio.getViewDefId() || ""
	return (
		<div
			onClick={(event: SyntheticEvent) => {
				uesio.builder.setSelectedNode(
					"viewdef",
					viewDefId,
					componentProps.path || ""
				)
				event.stopPropagation()
			}}
			style={{
				color: "rgba(255, 128, 128)",
				padding: "10px 10px 2px",
				border: "1px solid rgba(255, 128, 128)",
				borderLeft: "5px solid rgba(255, 128, 128)",
			}}
		>
			<p
				style={{
					textTransform: "uppercase",
					fontSize: "8pt",
					fontWeight: "bold",
					margin: 0,
				}}
			>
				{cname}
			</p>
			<pre style={{ whiteSpace: "normal" }}>{error?.message}</pre>
		</div>
	)
}

export default slotError
