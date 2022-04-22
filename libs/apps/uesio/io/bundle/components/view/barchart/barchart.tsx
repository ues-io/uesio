import { FC } from "react"
import { component } from "@uesio/ui"
import { Props } from "./barchartdefinition"
import { Bar } from "react-chartjs-2"
import { ChartUtilityProps } from "../../utility/chart/chart"

const IOChart =
	component.registry.getUtility<ChartUtilityProps>("uesio/io.chart")

const ChartComponent: FC<Props> = (props) => (
	<IOChart
		ChartComponent={Bar}
		definition={props.definition}
		context={props.context}
	/>
)

export default ChartComponent
