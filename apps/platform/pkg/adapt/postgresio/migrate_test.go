package postgresio

import (
	"errors"
	"testing"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func TestGetConnectionString(t *testing.T) {

	type testCase struct {
		description      string
		creds            *adapt.Credentials
		expectConnString string
		expectErr        error
	}

	var tests = []testCase{
		{
			"build a connection string with regular chars",
			&adapt.Credentials{
				"host":     "some.host",
				"port":     "1234",
				"user":     "un",
				"password": "pw",
				"database": "foo",
			},
			"postgres://un:pw@some.host:1234/foo?sslmode=disable",
			nil,
		},
		{
			"default to 5432 if no port provided",
			&adapt.Credentials{
				"host":     "some.host",
				"user":     "un",
				"password": "pw",
				"database": "foo",
			},
			"postgres://un:pw@some.host:5432/foo?sslmode=disable",
			nil,
		},
		{
			"require user",
			&adapt.Credentials{
				"host": "localhost",
			},
			"",
			errors.New("no user entry provided in credentials"),
		},
		{
			"require password",
			&adapt.Credentials{
				"host": "localhost",
				"user": "foo",
			},
			"",
			errors.New("no password entry provided in credentials"),
		},
		{
			"require database",
			&adapt.Credentials{
				"host":     "localhost",
				"user":     "foo",
				"password": "bar",
			},
			"",
			errors.New("no database entry provided in credentials"),
		},
		{
			"escape URL-unsafe characters in password",
			&adapt.Credentials{
				"host":     "some.host",
				"user":     "un",
				"password": "acbd`cjaskf;",
				"database": "foo",
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
