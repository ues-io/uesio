package datasource

import "github.com/thecloudmasters/uesio/pkg/adapters"

// SaveResponseBatch struct
type SaveResponseBatch struct {
	Wires []adapters.SaveResponse `json:"wires"`
}
