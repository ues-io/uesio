package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ResultsAPI type
type ResultsAPI struct {
	results  map[string]reqs.ChangeResult
	changes  map[string]reqs.ChangeRequest
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
