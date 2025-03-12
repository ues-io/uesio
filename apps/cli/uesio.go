package main

import (
	"os"

	"github.com/thecloudmasters/cli/pkg/cmd"
)

func main() {
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
	os.Exit(0)
}
