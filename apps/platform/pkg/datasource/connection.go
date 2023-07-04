package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetConnection(dataSourceKey string, metadata *adapt.MetadataCache, session *sess.Session, connection adapt.Connection) (adapt.Connection, error) {

	// If we were provided a default connection for this datasource,
	// use that instead
	if connection != nil {
		return connection, nil
	}

	datasource, err := meta.NewDataSource(dataSourceKey)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(datasource, session, nil)
	if err != nil {
		return nil, err
	}

	mergedType, err := configstore.Merge(datasource.Type, session)
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
