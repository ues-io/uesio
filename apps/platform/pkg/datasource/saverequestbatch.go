package datasource

import "github.com/thecloudmasters/uesio/pkg/adapters"

// SaveRequestBatch struct
type SaveRequestBatch struct {
	Wires []adapters.SaveRequest `json:"wires"`
}
