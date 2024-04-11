import { definition } from "@uesio/ui"

import { Handle, Position } from "reactflow"

import "reactflow/dist/style.css"

type FlowHandleProps = {
	position: Position
}

const FlowHandleUtility: definition.UtilityComponent<FlowHandleProps> = () => (
	<Handle type="source" position={Position.Bottom} id="a" />
)

export default FlowHandleUtility
