import { FC } from "react"
import { component } from "@uesio/ui"
import { ChartUtilityProps } from "../../utility/chart/chart"
import { Props } from "./linechartdefinition"
import { Line } from "react-chartjs-2"
const IOChart =
	component.registry.getUtility<ChartUtilityProps>("uesio/io.chart")

const ChartComponent: FC<Props> = (props) => (
	<IOChart
		ChartComponent={Line}
		definition={props.definition}
		context={props.context}
	/>
)

export default ChartComponent
