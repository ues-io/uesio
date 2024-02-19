import { styles, api, definition } from "@uesio/ui"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid" // a plugin!

type EventSource = {
	label: string
	startField: string
	endField: string
	allDayField: string
	wire: string
}

type CalendarDefinition = {
	weekends?: boolean
	events?: EventSource[]
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Calendar: definition.UC<CalendarDefinition> = (props) => {
	const { definition, context } = props
	const { weekends, events } = definition
	const classes = styles.useStyleTokens(StyleDefaults, props)

	// Get a list of all wires used
	const wireNames = events?.map(({ wire }) => wire || "") || []

	const wires = api.wire.useWires(wireNames, context)

	const eventData = events?.flatMap((eventsource) => {
		const {
			wire: wireName,
			startField: startFieldName,
			endField: endFieldName,
			allDayField: allDayFieldName,
		} = eventsource
		const wire = wires[wireName]
		if (!wire) return []
		const collection = wire.getCollection()
		const startField = collection.getField(startFieldName)
		if (!startField) {
			throw new Error("Invalid start field")
		}
		if (!["TIMESTAMP", "DATE"].includes(startField.getType())) {
			throw new Error(
				"Invalid type for start field: " + startField.getType()
			)
		}

		const endField = collection.getField(endFieldName)
		if (endField && !["TIMESTAMP", "DATE"].includes(endField.getType())) {
			throw new Error("Invalid type for end field: " + endField.getType())
		}
		const allDayField = collection.getField(allDayFieldName)
		if (allDayField && allDayField.getType() !== "CHECKBOX") {
			throw new Error(
				"Invalid type for allDay field: " + allDayField.getType()
			)
		}

		return wire?.getData().flatMap((record) => {
			const recordContext = context.addRecordFrame({
				wire: wire.getId(),
				record: record.getId(),
			})
			const title = recordContext.mergeString(eventsource.label)
			const start = record.getDateValue(startFieldName)
			const end = record.getDateValue(endFieldName)
			const allDay = allDayField
				? record.getFieldValue<boolean>(allDayFieldName)
				: true
			if (!start) return []
			return [
				{
					title,
					start,
					end,
					allDay,
				},
			]
		})
	})

	return (
		<div className={classes.root}>
			<FullCalendar
				plugins={[dayGridPlugin]}
				weekends={weekends}
				initialView="dayGridMonth"
				events={eventData}
			/>
		</div>
	)
}

export default Calendar
