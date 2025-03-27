package botutils

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// TODO: The prior version of this lived in systembot_load_external.go and only applied to system bots with external.
// This makes it a utility function that can be used regardless of dialect.  To maintain full backwards compat,
// accepting IntegrationConnection and separate Session since that is the way that it worked previously but
// IntegrationConnection has the session on it so possibly could just reduce to a single param.  Unclear
// if it's possible for the session passed to a "loadbotfunc" could ever be different than the one associated
// with the IntegrationConnection available vai op.GetIntegration().  Depending on that answer, reduce
// this to a single param or leave as-is.
func GetBaseURL(integrationConnection *wire.IntegrationConnection, session *sess.Session) (string, error) {
	integration := integrationConnection.GetIntegration()
	if integration == nil {
		return "", errors.New("not integration provided by integration connection")
	}

	return processMerge(integration.BaseURL, session)
}

func processMerge(templateString string, session *sess.Session) (string, error) {
	template, err := templating.NewWithFuncs(templateString, templating.ForceErrorFunc, merge.ServerMergeFuncs)
	if err != nil {
		return "", err
	}

	x, err := templating.Execute(template, merge.ServerMergeData{
		Session: session,
	})
	return x, err

}
