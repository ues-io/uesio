package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// LoadRequestBatch struct
type LoadRequestBatch struct {
	Wires []adapt.LoadRequest `json:"wires"`
}
