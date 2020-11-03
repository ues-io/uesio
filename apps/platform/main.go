package main

import (
	"os"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/adapters/dynamodb"
	"github.com/thecloudmasters/uesio/pkg/adapters/dynamodbmultiple"
	"github.com/thecloudmasters/uesio/pkg/adapters/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapters/mysql"
	"github.com/thecloudmasters/uesio/pkg/adapters/postgresql"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/auth/cognito"
	"github.com/thecloudmasters/uesio/pkg/auth/facebook"
	"github.com/thecloudmasters/uesio/pkg/auth/google"
	"github.com/thecloudmasters/uesio/pkg/auth/mock"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/platformbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/workspacebundlestore"
	"github.com/thecloudmasters/uesio/pkg/cmd"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	configenvironmentstore "github.com/thecloudmasters/uesio/pkg/configstore/environment"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/fileadapters/gcpstorage"
	"github.com/thecloudmasters/uesio/pkg/fileadapters/localfiles"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	secretenvironmentstore "github.com/thecloudmasters/uesio/pkg/secretstore/environment"
)

func init() {
	// Initialize Plugins

	// Data Adapters
	adapters.RegisterAdapter("uesio.firestore", &firestore.Adapter{})
	adapters.RegisterAdapter("uesio.dynamodb", &dynamodb.Adapter{})
	adapters.RegisterAdapter("uesio.dynamodbmultiple", &dynamodbmultiple.Adapter{})
	adapters.RegisterAdapter("uesio.postgresql", &postgresql.Adapter{})
	adapters.RegisterAdapter("uesio.mysql", &mysql.Adapter{})

	// Authentication Types
	auth.RegisterAuthType("google", &google.Auth{})
	auth.RegisterAuthType("mock", &mock.Auth{})
	auth.RegisterAuthType("facebook", &facebook.Auth{})
	auth.RegisterAuthType("cognito", &cognito.Auth{})

	// File Adapters
	fileadapters.RegisterFileAdapter("uesio.gcpstorage", &gcpstorage.FileAdapter{})
	fileadapters.RegisterFileAdapter("uesio.local", &localfiles.FileAdapter{})

	// Config Stores
	configstore.RegisterConfigStore("environment", &configenvironmentstore.ConfigStore{})

	// Secret Stores
	secretstore.RegisterSecretStore("environment", &secretenvironmentstore.SecretStore{})

	// Bundle Stores
	bundlestore.RegisterBundleStore("local", &localbundlestore.LocalBundleStore{})
	bundlestore.RegisterBundleStore("workspace", &workspacebundlestore.WorkspaceBundleStore{})
	bundlestore.RegisterBundleStore("platform", &platformbundlestore.PlatformBundleStore{})
}

func main() {
	if err := cmd.RootCmd.Execute(); err != nil {
		logger.LogError(err)
		os.Exit(-1)
	}
}
