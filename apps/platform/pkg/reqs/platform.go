package reqs

// NewPlatformLoadRequest function
func NewPlatformLoadRequest(wireName, collectionName string, fields []string, conditions []LoadRequestCondition) LoadRequest {
	fieldRequests := []LoadRequestField{}
	for _, field := range fields {
		fieldRequests = append(fieldRequests, LoadRequestField{
			ID: "uesio." + field,
		})
	}

	return LoadRequest{
		Collection: "uesio." + collectionName,
		Wire:       wireName,
		Fields:     fieldRequests,
		Conditions: conditions,
	}
}
