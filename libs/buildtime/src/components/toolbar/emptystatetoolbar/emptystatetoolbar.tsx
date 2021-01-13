import React, { FunctionComponent } from "react"
import { definition } from "@uesio/ui"
import ToolbarTitle from "../toolbartitle"


interface Props extends definition.BaseProps {
	selectedNode: string
}

const EmptyStateToolbar: FunctionComponent<Props> = () => (
		<ToolbarTitle title="Nothing selected" />
		)

export default EmptyStateToolbar
