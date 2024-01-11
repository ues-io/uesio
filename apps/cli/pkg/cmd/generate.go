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
		Use:   "generate",
		Short: "Create new metadata using a guided wizard",
		Run:   generate,
	}

	rootCmd.AddCommand(generateCommand)

}

func generate(cmd *cobra.Command, args []string) {
	var generatorName string
	var err error
	if len(args) >= 1 {
		generatorName = args[0]
	}
	// If we don't have a generator, prompt for one
	if generatorName == "" {
		generatorName = promptForGenerator()
	}
	if generatorName == "" {
		fmt.Println("no generator provided")
		return
	}

	if err = command.Generate(generatorName); err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

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
