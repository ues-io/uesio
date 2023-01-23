import { definition } from "@uesio/ui"

const OrderProperties: definition.UtilityComponent = (props) => {
	const { context } = props
	console.log(context)
	return <>Order</>
}

OrderProperties.displayName = "OrderProperties"

export default OrderProperties
