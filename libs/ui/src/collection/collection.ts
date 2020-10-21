import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import { FieldMetadataMap, Field } from "./field"
import { ActorAction, StoreAction } from "../store/actions/actions"
import { Dispatcher } from "../store/store"

type PlainCollection = {
	name: string
	namespace: string
	idField: string
	nameField: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	deleteable: boolean
	fields: FieldMetadataMap
}

type PlainCollectionMap = {
	[key: string]: PlainCollection
}

class Collection extends Actor {
	constructor(source: PlainCollection | null) {
		super()
		this.valid = !!source
		this.source = source || ({} as PlainCollection)
	}

	source: PlainCollection
	valid: boolean

	receiveAction(action: ActorAction, state: RuntimeState): RuntimeState {
		return state
	}

	receiveSignal(): Dispatcher<StoreAction> {
		return (): null => null
	}

	// Serializes this wire into a redux state
	toState(): PlainCollection {
		return { ...this.source }
	}

	getId(): string {
		return this.source.name
	}

	getNamespace(): string {
		return this.source.namespace
	}

	isValid(): boolean {
		return this.valid
	}

	getField(fieldName: string | null): Field {
		const fieldMetadata =
			this.source && fieldName ? this.source.fields[fieldName] : null
		return new Field(fieldMetadata)
	}

	getIdField(): Field {
		return this.getField(this.source ? this.source.idField : null)
	}
}

export { Collection, PlainCollectionMap, PlainCollection }
