package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// LoadRequestBatch struct
type LoadRequestBatch struct {
	Wires []adapters.LoadRequest `json:"wires"`
}
