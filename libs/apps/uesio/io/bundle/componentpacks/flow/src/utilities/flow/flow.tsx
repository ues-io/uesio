import { definition } from "@uesio/ui"

import Dagre, { GraphLabel } from "@dagrejs/dagre"
import ReactFlow, {
	BackgroundVariant,
	Background,
	Controls,
	Node,
	Edge,
	NodeTypes,
} from "reactflow"

import "reactflow/dist/style.css"

type FlowProps = {
	nodes: Node[]
	edges: Edge[]
	nodeTypes?: NodeTypes
}

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	options: GraphLabel
) => {
	g.setGraph(options)

	edges.forEach((edge) => g.setEdge(edge.source, edge.target))
	nodes.forEach((node) => g.setNode(node.id, node as unknown as string))

	Dagre.layout(g)

	return {
		nodes: nodes.map((node) => {
			const { x, y, width, height } = g.node(node.id)

			return {
				...node,
				position: { x: x - width / 2, y: y - height / 2 },
			}
		}),
		edges,
	}
}

const FlowUtility: definition.UtilityComponent<FlowProps> = (props) => {
	const { nodes, edges, nodeTypes } = props

	const layouted = getLayoutedElements(nodes, edges, {
		rankdir: "TB",
		nodesep: 40,
		ranksep: 40,
	})

	return (
		<ReactFlow
			nodes={layouted.nodes}
			proOptions={{ hideAttribution: true }}
			edges={layouted.edges}
			fitView={true}
			fitViewOptions={{
				maxZoom: 1,
			}}
			nodeTypes={nodeTypes}
		>
			<Controls />
			<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
		</ReactFlow>
	)
}

export default FlowUtility
