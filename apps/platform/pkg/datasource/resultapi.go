package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// ResultAPI type
type ResultAPI struct {
	result   adapt.ChangeResult
	change   adapt.ChangeRequest
	metadata *adapt.CollectionMetadata
}

// Get function
func (r *ResultAPI) Get(fieldName string) interface{} {
	return r.result.Data[fieldName]
}

// IsNew function
func (r *ResultAPI) IsNew() bool {
	return r.change.IsNew
}
