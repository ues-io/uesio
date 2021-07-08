package main

import (
	"os"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/adapt/dynamodb"
	"github.com/thecloudmasters/uesio/pkg/adapt/dynamodbmultiple"
	"github.com/thecloudmasters/uesio/pkg/adapt/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapt/sql/mysql"
	"github.com/thecloudmasters/uesio/pkg/adapt/sql/postgresql"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/auth/cognito"
	"github.com/thecloudmasters/uesio/pkg/auth/facebook"
	"github.com/thecloudmasters/uesio/pkg/auth/google"
	"github.com/thecloudmasters/uesio/pkg/auth/mock"
	"github.com/thecloudmasters/uesio/pkg/bot/jsdialect"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/platformbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/workspacebundlestore"
	"github.com/thecloudmasters/uesio/pkg/cmd"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	cse "github.com/thecloudmasters/uesio/pkg/configstore/environment"
	csp "github.com/thecloudmasters/uesio/pkg/configstore/platform"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/gcpstorage"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	sse "github.com/thecloudmasters/uesio/pkg/secretstore/environment"
	ssp "github.com/thecloudmasters/uesio/pkg/secretstore/platform"
)

func init() {
	// Initialize Plugins

	// Data Adapters
	adapt.RegisterAdapter("uesio.firestore", &firestore.Adapter{})
	adapt.RegisterAdapter("uesio.dynamodb", &dynamodb.Adapter{})
	adapt.RegisterAdapter("uesio.dynamodbmultiple", &dynamodbmultiple.Adapter{})
	adapt.RegisterAdapter("uesio.postgresql", &postgresql.Adapter{})
	adapt.RegisterAdapter("uesio.mysql", &mysql.Adapter{})

	// Authentication Types
	auth.RegisterAuthType("google", &google.Auth{})
	val, _ := os.LookupEnv("UESIO_MOCK_AUTH")
	if val == "true" {
		auth.RegisterAuthType("mock", &mock.Auth{})
	}
	auth.RegisterAuthType("facebook", &facebook.Auth{})
	auth.RegisterAuthType("cognito", &cognito.Auth{})

	// File Adapters
	fileadapt.RegisterFileAdapter("uesio.gcpstorage", &gcpstorage.FileAdapter{})
	fileadapt.RegisterFileAdapter("uesio.local", &localfiles.FileAdapter{})

	// Config Stores
	configstore.RegisterConfigStore("environment", &cse.ConfigStore{})
	configstore.RegisterConfigStore("platform", &csp.ConfigStore{})

	// Secret Stores
	secretstore.RegisterSecretStore("environment", &sse.SecretStore{})
	secretstore.RegisterSecretStore("platform", &ssp.SecretStore{})

	// Bundle Stores
	bundlestore.RegisterBundleStore("local", &localbundlestore.LocalBundleStore{})
	bundlestore.RegisterBundleStore("system", &systembundlestore.SystemBundleStore{})
	bundlestore.RegisterBundleStore("workspace", &workspacebundlestore.WorkspaceBundleStore{})
	bundlestore.RegisterBundleStore("platform", &platformbundlestore.PlatformBundleStore{})

	// Bot Dialects
	datasource.RegisterBotDialect("javascript", &jsdialect.JSDialect{})
}

func main() {
	if err := cmd.RootCmd.Execute(); err != nil {
		logger.LogError(err)
		os.Exit(-1)
	}
}
