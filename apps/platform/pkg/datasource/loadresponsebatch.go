package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// LoadResponseBatch struct
type LoadResponseBatch struct {
	Wires       []adapt.LoadOp                       `json:"wires"`
	Collections map[string]*adapt.CollectionMetadata `json:"collections"`
}
