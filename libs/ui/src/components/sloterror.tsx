import React, { FC, SyntheticEvent } from "react"
import { UtilityPropsPlus } from "../definition/definition"
import { toPath } from "../component/path"
import { useUesio } from "../hooks/hooks"

type T = {
	error: Error | null
	componentProps: UtilityPropsPlus
}
// const Icon = getUtility("uesio/io.icon")

const slotError: FC<T> = ({ error, componentProps }) => {
	const name = toPath(componentProps.path).pop()
	const uesio = useUesio(componentProps)
	const viewDefId = uesio.getViewDefId() || ""

	console.log("sloterror", { name })
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
				// border: "1px solid rgb(92, 0, 0)",
				border: "1px solid rgba(255, 128, 128)",
				borderRadius: "5px",
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
				{name}
			</p>
			<pre>{error?.message}</pre>
			{/* <pre>{JSON.stringify(componentProps, null, 4)}</pre> */}
		</div>
	)
}

export default slotError
