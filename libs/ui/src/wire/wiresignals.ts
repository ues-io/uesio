import { ActorSignal } from "../definition/signal"

const TOGGLE_DELETE_STATUS = "TOGGLE_DELETE_STATUS"
const MARK_FOR_DELETE = "MARK_FOR_DELETE"
const UNMARK_FOR_DELETE = "UNMARK_FOR_DELETE"
const CANCEL = "CANCEL"
const CREATE_RECORD = "CREATE_RECORD"
const UPDATE_RECORD = "UPDATE_RECORD"
const SET_RECORD = "SET_RECORD"
const TOGGLE_CONDITION = "TOGGLE_CONDITION"

interface ToggleDeleteStatusSignal extends ActorSignal {
	signal: typeof TOGGLE_DELETE_STATUS
}

interface MarkForDeleteSignal extends ActorSignal {
	signal: typeof TOGGLE_DELETE_STATUS
}

interface UnmarkForDeleteSignal extends ActorSignal {
	signal: typeof TOGGLE_DELETE_STATUS
}

interface CancelSignal extends ActorSignal {
	signal: typeof CANCEL
}

interface ToggleConditionSignal extends ActorSignal {
	signal: typeof TOGGLE_CONDITION
	conditionId: string
}

interface CreateRecordSignal extends ActorSignal {
	signal: typeof CREATE_RECORD
}

interface UpdateRecordSignal extends ActorSignal {
	signal: typeof UPDATE_RECORD
}

interface SetRecordSignal extends ActorSignal {
	signal: typeof SET_RECORD
}

export {
	TOGGLE_DELETE_STATUS,
	MARK_FOR_DELETE,
	UNMARK_FOR_DELETE,
	CREATE_RECORD,
	UPDATE_RECORD,
	SET_RECORD,
	TOGGLE_CONDITION,
	CreateRecordSignal,
	UpdateRecordSignal,
	SetRecordSignal,
	CancelSignal,
	ToggleDeleteStatusSignal,
	MarkForDeleteSignal,
	UnmarkForDeleteSignal,
	ToggleConditionSignal,
}
