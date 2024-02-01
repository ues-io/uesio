package postgresio

import (
	"errors"
	"testing"

	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func TestGetConnectionString(t *testing.T) {

	type testCase struct {
		description      string
		creds            *wire.Credentials
		expectConnString string
		expectErr        error
	}

	var tests = []testCase{
		{
			"build a connection string with regular chars",
			&wire.Credentials{
				"host":     "some.host",
				"port":     "1234",
				"username": "un",
				"password": "pw",
				"database": "foo",
				"sslmode":  "disable",
			},
			"postgres://un:pw@some.host:1234/foo?sslmode=disable",
			nil,
		},
		{
			"default to 5432 if no port provided",
			&wire.Credentials{
				"host":     "some.host",
				"username": "un",
				"password": "pw",
				"database": "foo",
				"sslmode":  "disable",
			},
			"postgres://un:pw@some.host:5432/foo?sslmode=disable",
			nil,
		},
		{
			"require username",
			&wire.Credentials{
				"host": "localhost",
			},
			"",
			errors.New("no username entry provided in credentials"),
		},
		{
			"require password",
			&wire.Credentials{
				"host":     "localhost",
				"username": "foo",
			},
			"",
			errors.New("no password entry provided in credentials"),
		},
		{
			"require database",
			&wire.Credentials{
				"host":     "localhost",
				"username": "foo",
				"password": "bar",
			},
			"",
			errors.New("no database entry provided in credentials"),
		},
		{
			"escape URL-unsafe characters in password",
			&wire.Credentials{
				"host":     "some.host",
				"username": "un",
				"password": "acbd`cjaskf;",
				"database": "foo",
				"sslmode":  "disable",
			},
			"postgres://un:acbd%60cjaskf%3B@some.host:5432/foo?sslmode=disable",
			nil,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {

			actual, err := getConnectionString(tc.creds)
			if tc.expectErr != nil {
				if tc.expectErr.Error() != err.Error() {
					t.Errorf("Expected failure %s but got %s", tc.expectErr.Error(), err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected failure getting connection string: %s", err.Error())
				}
				if actual != tc.expectConnString {
					t.Errorf("Unexpected connection string: %s", actual)
				}
			}

		})
	}
}
