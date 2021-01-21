package firestore

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapters.MetadataCache, credentials *adapters.Credentials) error {
	fmt.Println("Migrating Firestore")
	return nil
}
