package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// LoadResponseBatch struct
type LoadResponseBatch struct {
	Wires       []reqs.LoadResponse                     `json:"wires"`
	Collections map[string]*adapters.CollectionMetadata `json:"collections"`
}
