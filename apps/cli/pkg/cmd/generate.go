package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/command"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func init() {

	generateCommand := &cobra.Command{
		Use:          "generate",
		Short:        "Create new metadata using a guided wizard",
		RunE:         generate,
		SilenceUsage: true,
	}

	rootCmd.AddCommand(generateCommand)

}

func generate(cmd *cobra.Command, args []string) error {
	var generatorName string
	if len(args) >= 1 {
		generatorName = args[0]
	}
	// If we don't have a generator, prompt for one
	if generatorName == "" {
		generatorName = promptForGenerator()
	}
	if generatorName == "" {
		return fmt.Errorf("no generator name provided")
	}

	return command.Generate(generatorName)
}

// TODO: Improve error handling vs. just returning empty string so
// something meaningful can be displayed to the user in failure cases
func promptForGenerator() string {
	// Make sure we are authed
	userMergeData, err := auth.Check()
	if err != nil {
		// attempt to log in
		userMergeData, err = auth.Login()
	}
	var sessionId string
	if err == nil && userMergeData != nil {
		sessionId, err = config.GetSessionID()
	}
	if err != nil {
		return ""
	}
	// Prompt the user to pick a Generator
	answers := map[string]interface{}{}
	// TODO: Eventually allow the user to pick ANY generator, for now just doing uesio/core ones
	if err = param.Ask(meta.BotParamResponse{
		Name:         "generator",
		Prompt:       "Select a generator",
		Type:         "METADATA",
		MetadataType: "BOT",
		Grouping:     "GENERATOR",
		Required:     true,
	}, "uesio/core", "0.0.1", sessionId, answers); err != nil {
		return ""
	}
	if generatorNameString, isString := answers["generator"].(string); isString {
		return generatorNameString
	}
	return ""
}
