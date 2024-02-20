import { styles, api, definition, signal, context, wire } from "@uesio/ui"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import { EventClickArg } from "@fullcalendar/core"

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
	onDateClick?: signal.SignalDefinition[]
	onEventClick?: signal.SignalDefinition[]
}

const checkEventSourceFieldTypes = (
	wire: wire.Wire,
	eventsource: EventSource
) => {
	const collection = wire.getCollection()
	const startField = collection.getField(eventsource.startField)
	const endField = collection.getField(eventsource.endField)
	const allDayField = collection.getField(eventsource.allDayField)

	if (!startField) {
		throw new Error("Invalid start field: " + eventsource.startField)
	}
	if (!["TIMESTAMP", "DATE"].includes(startField.getType())) {
		throw new Error(
			"Invalid type for start field: " +
				startField.getType() +
				" must be a DATE or TIMESTAMP field."
		)
	}

	if (endField && !["TIMESTAMP", "DATE"].includes(endField.getType())) {
		throw new Error(
			"Invalid type for end field: " +
				endField.getType() +
				" must be a DATE or TIMESTAMP field."
		)
	}

	if (allDayField && allDayField.getType() !== "CHECKBOX") {
		throw new Error(
			"Invalid type for allDay field: " +
				allDayField.getType() +
				" must be a CHECKBOX field."
		)
	}
}

const getEventsForSource = (
	wire: wire.Wire,
	eventsource: EventSource,
	context: context.Context
) => {
	checkEventSourceFieldTypes(wire, eventsource)
	return wire?.getData().flatMap((record) => {
		const id = record.getId()
		const recordContext = context.addRecordFrame({
			wire: wire.getId(),
			record: id,
		})
		const title = recordContext.mergeString(eventsource.label)
		const start = record.getDateValue(eventsource.startField)
		const end = record.getDateValue(eventsource.endField)
		const allDay = record.getFieldValue<boolean>(eventsource.allDayField)

		if (!start) return []
		return [
			{
				id,
				title,
				start,
				end,
				allDay,
				extendedProps: {
					context: recordContext,
				},
			},
		]
	})
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Calendar: definition.UC<CalendarDefinition> = (props) => {
	const { definition, context } = props
	const { weekends, events, onDateClick, onEventClick } = definition
	const classes = styles.useStyleTokens(StyleDefaults, props)

	// Get a list of all wires used
	const wireNames = events?.map(({ wire }) => wire || "") || []

	const wires = api.wire.useWires(wireNames, context)

	const onDateHandler = onDateClick
		? (dateArg: DateClickArg) =>
				api.signal.runMany(
					onDateClick,
					context.addSignalOutputFrame("dateClick", {
						timestamp: dateArg.date.getTime() / 1000,
						date: dateArg.dateStr,
					})
				)
		: undefined

	const onEventHandler = onEventClick
		? (eventArg: EventClickArg) =>
				api.signal.runMany(
					onEventClick,
					eventArg.event.extendedProps.context
				)
		: undefined

	const eventData = events?.flatMap((eventsource) => {
		const wire = wires[eventsource.wire]
		if (!wire) return []
		return getEventsForSource(wire, eventsource, context)
	})

	return (
		<div className={classes.root}>
			<FullCalendar
				plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
				weekends={weekends}
				initialView="dayGridMonth"
				headerToolbar={{
					left: "prev,next today",
					center: "title",
					right: "dayGridMonth,timeGridWeek,timeGridDay",
				}}
				events={eventData}
				dateClick={onDateHandler}
				eventClick={onEventHandler}
				defaultAllDay={true}
			/>
		</div>
	)
}

export default Calendar
