package adapt

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

const MAX_LOAD_BATCH_SIZE = 500
const MAX_SAVE_BATCH_SIZE = 500
const MAX_ITER_REF_GROUP = 10

type Adapter interface {
	// GetCredentials returns the unique key of the credentials metadata record to use for this adapter
	GetCredentials() string
	// GetConnection returns a connection to use for this adapter
	GetConnection(context.Context, *wire.Credentials, string) (wire.Connection, error)
}

var adapterMap = map[string]Adapter{}

// GetAdapter gets an adapter of a certain type
func GetAdapter(adapterType string) (Adapter, error) {

	adapter, ok := adapterMap[adapterType]
	if !ok {
		return nil, fmt.Errorf("no adapter found of this type: %s", adapterType)
	}
	return adapter, nil
}

func RegisterAdapter(name string, adapter Adapter) {
	adapterMap[name] = adapter
}
