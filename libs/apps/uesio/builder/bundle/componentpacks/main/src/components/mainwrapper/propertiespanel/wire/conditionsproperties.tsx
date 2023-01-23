import { definition } from "@uesio/ui"

const ConditionsProperties: definition.UtilityComponent = (props) => {
	const { context } = props
	console.log(context)
	return <>Conditions</>
}

ConditionsProperties.displayName = "ConditionsProperties"

export default ConditionsProperties
