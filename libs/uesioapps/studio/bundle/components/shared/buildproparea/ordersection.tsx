import { FunctionComponent } from "react"
import { definition, hooks, builder } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import PropNodeTag from "../buildpropitem/propnodetag"
import PropertiesPane from "../propertiespane"

function getOrderTitle(order: OrderDefinition): string {
	if (order.field) {
		return `${order.field} | ${order.desc ? "Descending" : "Ascending"}`
	}
	return "NEW_VALUE"
}

const getOrderProperties = (): builder.PropDescriptor[] => [
	{
		name: "field",
		type: "METADATA",
		metadataType: "FIELD",
		label: "Field",
		groupingParents: 2,
		groupingProperty: "collection",
	},
	{
		name: "desc",
		type: "BOOLEAN",
		label: "Descending",
	},
]

type OrderDefinition = { desc: boolean; field: string }

const OrderSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, valueAPI } = props
	const wireDef = valueAPI.get(path || "") as
		| definition.DefinitionMap
		| undefined
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const [, , selectedNode] = uesio.builder.useSelectedNode()
	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const orderDef = wireDef?.order as definition.Definition[] | undefined
	const primaryColor = theme.definition.palette.primary

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			action="add_box"
			actionColor={primaryColor}
			actionOnClick={() => {
				valueAPI.add(`${path}["order"]`, {
					field: null,
					desc: false,
				})
			}}
			context={context}
			styles={{
				innerContent: {
					display: "grid",
					rowGap: "8px",
				},
			}}
		>
			{orderDef?.map((order: OrderDefinition, index) => {
				const orderPath = `${path}["order"]["${index}"]`
				const selected = selectedNode.startsWith(orderPath)
				return (
					<PropNodeTag
						title={getOrderTitle(order)}
						icon={"filter_list"}
						selected={selected}
						iconColor={primaryColor}
						key={index}
						onClick={() => {
							uesio.builder.setSelectedNode(
								"viewdef",
								viewDefId,
								orderPath
							)
						}}
						popChildren
						context={context}
					>
						{
							<PropertiesPane
								path={orderPath}
								index={0}
								context={context}
								propsDef={{
									title: "Order By",
									sections: [],
									defaultDefinition: () => ({}),
									properties: getOrderProperties(),
									actions: [],
								}}
								valueAPI={valueAPI}
							/>
						}
					</PropNodeTag>
				)
			})}
		</ExpandPanel>
	)
}

export default OrderSection
