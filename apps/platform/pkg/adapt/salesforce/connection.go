package salesforce

import (
	"github.com/simpleforce/simpleforce"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type Connection struct {
	metadata    *adapt.MetadataCache
	credentials *adapt.Credentials
	tokens      []string
	client      *simpleforce.Client
}

func (c *Connection) GetAutonumber(collectionMetadata *adapt.CollectionMetadata) (int, error) {
	return 0, nil
}

func (c *Connection) GetCredentials() *adapt.Credentials {
	return c.credentials
}

func (c *Connection) GetMetadata() *adapt.MetadataCache {
	return c.metadata
}

func (c *Connection) GetClient() *simpleforce.Client {
	return c.client
}

func (c *Connection) Migrate() error {
	return nil
}

// Load function
func (a *Adapter) GetConnection(credentials *adapt.Credentials, metadata *adapt.MetadataCache, tokens []string) (adapt.Connection, error) {
	client, err := connect(credentials)
	if err != nil {
		return nil, err
	}
	return &Connection{
		metadata:    metadata,
		credentials: credentials,
		tokens:      tokens,
		client:      client,
	}, nil
}
