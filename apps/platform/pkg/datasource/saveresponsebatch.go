package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// SaveResponseBatch struct
type SaveResponseBatch struct {
	Wires []adapt.SaveResponse `json:"wires"`
}
