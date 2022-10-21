package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func HasExistingConnection(dataSourceKey string, connections map[string]adapt.Connection) bool {
	if connections != nil {
		_, ok := connections[dataSourceKey]
		return ok
	}
	return false
}

func GetConnection(dataSourceKey string, metadata *adapt.MetadataCache, session *sess.Session, connections map[string]adapt.Connection) (adapt.Connection, error) {

	// If we were provided a default connection for this datasource,
	// use that instead
	if connections != nil {
		connection, ok := connections[dataSourceKey]
		if ok {
			connection.SetMetadata(metadata)
			return connection, nil
		}
	}
	datasource, err := meta.NewDataSource(dataSourceKey)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(datasource, session)
	if err != nil {
		return nil, err
	}

	adapterType := datasource.Type
	mergedType, err := configstore.Merge(adapterType, session)
	if err != nil {
		return nil, err
	}
	adapter, err := adapt.GetAdapter(mergedType, session)
	if err != nil {
		return nil, err
	}
	credentials, err := creds.GetCredentials(datasource.Credentials, session)
	if err != nil {
		return nil, err
	}

	return adapter.GetConnection(credentials, metadata, dataSourceKey)

}
