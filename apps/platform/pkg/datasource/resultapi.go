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
	idField, err := r.metadata.GetIDField()
	if err != nil {
		// It's ok to panic here because it will be thrown as a javascript exception
		panic("No ID Field Found")
	}

	_, ok := r.change[idField.GetFullName()]

	return !ok
}
