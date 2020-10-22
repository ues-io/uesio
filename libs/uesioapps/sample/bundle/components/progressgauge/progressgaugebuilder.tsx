import React, { ReactElement } from "react"
import ProgressGauge from "./progressgauge"
import { hooks } from "@uesio/ui"
import {
	ProgressGaugeProps,
	ProgressGaugeDefinition,
} from "./progressgaugedefinition"

function ProgressGaugeBuilder(props: ProgressGaugeProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ProgressGaugeDefinition
	return <ProgressGauge {...props} definition={definition}></ProgressGauge>
}

export default ProgressGaugeBuilder
