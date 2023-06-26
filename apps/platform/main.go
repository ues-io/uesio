package main

import (
	"mime"
	"os"

	"github.com/thecloudmasters/uesio/pkg/bot"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/adapt/postgresio"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/auth/cognito"
	"github.com/thecloudmasters/uesio/pkg/auth/mock"
	"github.com/thecloudmasters/uesio/pkg/bot/jsdialect"
	"github.com/thecloudmasters/uesio/pkg/bot/systemdialect"
	"github.com/thecloudmasters/uesio/pkg/bot/tsdialect"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/platformbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/workspacebundlestore"
	"github.com/thecloudmasters/uesio/pkg/cmd"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	cse "github.com/thecloudmasters/uesio/pkg/configstore/environment"
	csp "github.com/thecloudmasters/uesio/pkg/configstore/platform"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	ffsp "github.com/thecloudmasters/uesio/pkg/featureflagstore/platform"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/s3"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/integ/sendgrid"
	"github.com/thecloudmasters/uesio/pkg/integ/web"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	sse "github.com/thecloudmasters/uesio/pkg/secretstore/environment"
	ssp "github.com/thecloudmasters/uesio/pkg/secretstore/platform"
)

func init() {
	// Initialize Plugins
	mime.AddExtensionType(".yaml", "application/x-yaml")
	mime.AddExtensionType(".md", "text/markdown")

	// Data Adapters
	adapt.RegisterAdapter("uesio.postgresio", &postgresio.Adapter{})

	// Authentication Types
	val, _ := os.LookupEnv("UESIO_MOCK_AUTH")
	if val == "true" {
		auth.RegisterAuthType("mock", &mock.Auth{})
	}
	auth.RegisterAuthType("cognito", &cognito.Auth{})

	// File Adapters
	fileadapt.RegisterFileAdapter("uesio.s3", &s3.FileAdapter{})
	fileadapt.RegisterFileAdapter("uesio.local", &localfiles.FileAdapter{})

	// Config Stores
	configstore.RegisterConfigStore("environment", &cse.ConfigStore{})
	configstore.RegisterConfigStore("platform", &csp.ConfigStore{})

	// Secret Stores
	secretstore.RegisterSecretStore("environment", &sse.SecretStore{})
	secretstore.RegisterSecretStore("platform", &ssp.SecretStore{})

	//Feature Flag Store
	featureflagstore.RegisterFeatureFlagStore("platform", &ffsp.FeatureFlagStore{})

	// Bundle Stores
	bundlestore.RegisterBundleStore("system", &systembundlestore.SystemBundleStore{})
	bundlestore.RegisterBundleStore("workspace", &workspacebundlestore.WorkspaceBundleStore{})
	bundlestore.RegisterBundleStore("platform", &platformbundlestore.PlatformBundleStore{})

	// Bot Dialects
	bot.RegisterBotDialect("javascript", &jsdialect.JSDialect{})
	bot.RegisterBotDialect("system", &systemdialect.SystemDialect{})
	bot.RegisterBotDialect("typescript", &tsdialect.TSDialect{})

	// Integration Types

	integ.RegisterIntegration("web", &web.WebIntegration{})
	integ.RegisterIntegration("sendgrid", &sendgrid.SendGridIntegration{})
}

func main() {
	cmd.Execute()
}
