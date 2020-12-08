import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"

// Both gets collection state and subscribes the component to collection changes
// Even if we don't have a collectionName sent in, we still need to call useSelector
// That way if a collection of that name ever comes available, we will be able to
// pick up that subscription.
const useCollection = (collectionName?: string) =>
	useSelector((state: RuntimeState) =>
		collectionName ? state.collection?.[collectionName] : undefined
	)

export { useCollection }
