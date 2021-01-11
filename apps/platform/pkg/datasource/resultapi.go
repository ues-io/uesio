package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ResultAPI type
type ResultAPI struct {
	result   adapters.ChangeResult
	change   adapters.ChangeRequest
	metadata *adapters.CollectionMetadata
}

// Get function
func (r *ResultAPI) Get(fieldName string) interface{} {
	return r.result.Data[fieldName]
}

// IsNew function
func (r *ResultAPI) IsNew() bool {
	return r.change.IsNew
}
