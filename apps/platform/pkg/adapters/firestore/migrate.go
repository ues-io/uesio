package firestore

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/creds"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {
	fmt.Println("Migrating Firestore")
	return nil
}
