package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ResultsAPI type
type ResultsAPI struct {
	results  map[string]adapters.ChangeResult
	changes  map[string]adapters.ChangeRequest
	metadata *adapters.CollectionMetadata
}

// Get function
func (r *ResultsAPI) Get() []*ResultAPI {
	resultAPIs := []*ResultAPI{}

	for recordKey, result := range r.results {
		change, ok := r.changes[recordKey]
		if !ok {
			continue
		}
		resultAPIs = append(resultAPIs, &ResultAPI{
			result:   result,
			change:   change,
			metadata: r.metadata,
		})
	}
	return resultAPIs
}
