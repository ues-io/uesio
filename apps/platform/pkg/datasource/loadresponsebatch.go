package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// LoadResponseBatch struct
type LoadResponseBatch struct {
	Wires       []adapters.LoadOp                       `json:"wires"`
	Collections map[string]*adapters.CollectionMetadata `json:"collections"`
}
