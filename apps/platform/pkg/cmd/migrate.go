package cmd

import (
	"context"
	"errors"
	"log/slog"
	"strconv"

	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/migrations"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func init() {
	rootCmd.AddCommand(&cobra.Command{
		Use:   "migrate",
		Short: "Run database migrations",
		Run:   migrate,
	})
}

func parseMigrateOptions(args []string) (*migrations.MigrateOptions, error) {
	opts := migrations.MigrateOptions{
		Down:   false,
		Number: 0,
	}
	// If no args, assume we want to migrate up as far as we can go
	if len(args) == 0 {
		return &opts, nil
	}
	// If one arg, it must be either "up" or "down"
	if len(args) >= 1 {
		opts.Down = args[0] == "down"
	}
	if len(args) == 2 {
		num, err := strconv.Atoi(args[1])
		if err != nil {
			return nil, errors.New("second argument must be a valid number of migrations to run")
		}
		opts.Number = num
	}
	return &opts, nil
}

func migrate(cmd *cobra.Command, args []string) {

	opts, err := parseMigrateOptions(args)
	cobra.CheckErr(err)

	ctx := context.Background()

	anonSession := sess.GetStudioAnonSession(ctx)

	err = datasource.WithTransaction(anonSession, nil, func(conn wire.Connection) error {
		return conn.Migrate(opts)
	})
	if err != nil {
		slog.Error("Migrations failed: " + err.Error())
		cobra.CheckErr(err)
		return
	}

	slog.Info("Successfully ran migrations")

}
