import { component, definition } from "@uesio/ui"
import { useSelectedPath } from "../../../../api/stateapi"
import { ComponentProperty } from "../../../../properties/componentproperty"

type OrderDefinition = { desc: boolean; field: string }

function getOrderTitle(order: OrderDefinition): string {
	if (order.field) {
		return `${order.field} | ${order.desc ? "Descending" : "Ascending"}`
	}
	return "NEW_VALUE"
}

const getOrderProperties = (): ComponentProperty[] => [
	{
		name: "field",
		type: "METADATA",
		metadataType: "FIELD",
		label: "Field",
		groupingPath: "../collection",
	},
	{
		name: "desc",
		type: "CHECKBOX",
		label: "Descending",
	},
]

const OrderProperties: definition.UC = (props) => {
	const { context } = props
	const ListProperty = component.getUtility("uesio/builder.listproperty")

	return (
		<ListProperty
			path={useSelectedPath(context).trimToSize(2)}
			itemProperties={getOrderProperties}
			itemPropertiesPanelTitle={"Order By"}
			propertyName={"order"}
			context={context}
			addLabel={"New Ordering"}
			itemDisplayTemplate={getOrderTitle}
			newItemState={() => ({ desc: false })}
		/>
	)
}

OrderProperties.displayName = "OrderProperties"

export default OrderProperties
