package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// SaveRequestBatch struct
type SaveRequestBatch struct {
	Wires []adapt.SaveRequest `json:"wires"`
}
