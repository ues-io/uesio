import { LoadResponseRecord } from "../load/loadresponse"
import { PlainWireRecord } from "./wirerecord"
import { ActorAction } from "../store/actions/actions"

const CREATE_RECORD = "CREATE_RECORD"
const UPDATE_RECORD = "UPDATE_RECORD"
const SET_RECORD = "SET_RECORD"
const CANCEL = "CANCEL"
const MARK_FOR_DELETE = "MARK_FOR_DELETE"
const UNMARK_FOR_DELETE = "UNMARK_FOR_DELETE"
const TOGGLE_DELETE_STATUS = "TOGGLE_DELETE_STATUS"
const TOGGLE_CONDITION = "TOGGLE_CONDITION"

interface CreateRecordAction extends ActorAction {
	name: typeof CREATE_RECORD
	data: LoadResponseRecord
}

interface UpdateRecordAction extends ActorAction {
	name: typeof UPDATE_RECORD
	data: {
		recordId: string
		record: PlainWireRecord
	}
}

interface SetRecordAction extends ActorAction {
	name: typeof SET_RECORD
	data: {
		recordId: string
		record: PlainWireRecord
	}
}

interface CancelAction extends ActorAction {
	name: typeof CANCEL
}

interface MarkForDeleteAction extends ActorAction {
	name: typeof MARK_FOR_DELETE
	data: {
		record: string
	}
}

interface UnMarkForDeleteAction extends ActorAction {
	name: typeof UNMARK_FOR_DELETE
	data: {
		record: string
	}
}

interface ToggleConditionAction extends ActorAction {
	name: typeof TOGGLE_CONDITION
	data: {
		conditionId: string
	}
}

export {
	CREATE_RECORD,
	UPDATE_RECORD,
	SET_RECORD,
	CANCEL,
	MARK_FOR_DELETE,
	UNMARK_FOR_DELETE,
	TOGGLE_DELETE_STATUS,
	TOGGLE_CONDITION,
	CreateRecordAction,
	UpdateRecordAction,
	SetRecordAction,
	CancelAction,
	MarkForDeleteAction,
	UnMarkForDeleteAction,
	ToggleConditionAction,
}
