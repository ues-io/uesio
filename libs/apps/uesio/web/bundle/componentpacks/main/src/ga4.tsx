import { FC, useEffect } from "react"
import { definition, api } from "@uesio/ui"

import ReactGA from "react-ga4"

const Ga4: FC<definition.BaseProps> = ({ context }) => {
	const path = context.getRoute()?.path

	const MEASUREMENT_ID = api.view.useConfigValue(
		"uesio/web.ga4_measurement_id"
	)

	useEffect(() => {
		if (!MEASUREMENT_ID) {
			return
		}
		ReactGA.initialize(MEASUREMENT_ID)
		ReactGA.send({
			hitType: "pageview",
			page: path,
		})
	}, [MEASUREMENT_ID, path])

	return null
}

export default Ga4
