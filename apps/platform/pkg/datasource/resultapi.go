package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ResultAPI type
type ResultAPI struct {
	result   reqs.ChangeResult
	change   reqs.ChangeRequest
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
