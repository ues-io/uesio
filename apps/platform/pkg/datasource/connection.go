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

	// Attach a version context so that we can load private credentials for this datasource
	dsNamespace := datasource.GetNamespace()
	appBundle := session.GetContextAppBundle()
	depVersion := ""
	if appBundle.Name == dsNamespace {
		depVersion = session.GetContextVersionName()
	} else if depBundle, hasDep := appBundle.Dependencies[dsNamespace]; hasDep {
		depVersion = depBundle.Version
	}
	session.AddVersionContext(&sess.VersionInfo{
		App:       session.GetContextAppName(),
		Namespace: dsNamespace,
		Version:   depVersion,
	})

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

	session.RemoveVersionContext()

	return adapter.GetConnection(credentials, metadata, dataSourceKey)
}
