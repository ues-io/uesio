package cmd

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strconv"

	"github.com/go-chi/traceid"
	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/migrations"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func init() {
	migrateCmd := &cobra.Command{
		Use:   "migrate",
		Short: "Run all database 'up' migrations",
		Long:  "Run all database 'up' migrations. Use 'up' or 'down' commands to specify direction and optional number of migrations.",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			// by default run all 'up' migrations
			opts := newMigrateUpOptions()
			return migrate(&opts)
		},
	}

	downCmd := &cobra.Command{
		Use:   "down [N]",
		Short: "Apply all or N down migrations",
		Args:  cobra.RangeArgs(0, 1),
		RunE: func(cmd *cobra.Command, args []string) error {
			opts := newMigrateDownOptions()
			all, _ := cmd.Flags().GetBool("all")
			if all {
				if len(args) > 0 {
					return errors.New("you cannot specify other arguments when using --all flag")
				}
			} else if len(args) == 0 {
				return errors.New("you must specify a number of migrations to apply or use --all flag")
			} else {
				num, err := getMigrationsToApply(args[0])
				if err != nil {
					return err
				}
				opts.Number = num
			}
			return migrate(&opts)
		},
	}
	downCmd.Flags().Bool("all", false, "Apply all down migrations")
	migrateCmd.AddCommand(downCmd)

	upCmd := &cobra.Command{
		Use:   "up [N]",
		Short: "Apply all or N up migrations",
		Args:  cobra.RangeArgs(0, 1),
		RunE: func(cmd *cobra.Command, args []string) error {
			opts := newMigrateUpOptions()
			if len(args) == 1 {
				num, err := getMigrationsToApply(args[0])
				if err != nil {
					return err
				}
				opts.Number = num
			}
			return migrate(&opts)
		},
	}
	migrateCmd.AddCommand(upCmd)

	rootCmd.AddCommand(migrateCmd)
}

func newMigrateUpOptions() migrations.MigrateOptions {
	return migrations.MigrateOptions{
		Down:   false,
		Number: 0, // 0 means all migrations
	}
}

func newMigrateDownOptions() migrations.MigrateOptions {
	return migrations.MigrateOptions{
		Down:   true,
		Number: 0, // 0 means all migrations
	}
}

func migrate(opts *migrations.MigrateOptions) error {
	ctx := traceid.NewContext(context.Background())
	slog.InfoContext(ctx, "Running migration(s)")

	anonSession := sess.GetStudioAnonSession(ctx)

	err := datasource.WithTransaction(anonSession, nil, func(conn wire.Connection) error {
		return conn.Migrate(opts)
	})
	if err != nil {
		return fmt.Errorf("migrations failed: %w", err)
	}

	slog.InfoContext(ctx, "Successfully ran migration(s)")
	return nil
}

func getMigrationsToApply(s string) (int, error) {
	num, err := strconv.Atoi(s)
	if err != nil {
		return 0, errors.New("number of migrations to apply must be a valid number")
	}
	if num <= 0 {
		return 0, errors.New("number of migrations to apply must be greater than 0")
	}
	return num, nil
}
