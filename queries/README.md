# Queries

A directory of helpful admin queries to run against the database

-   ./usage.sql -- get a summary of non-Uesio users by month and user

## Example usage

### Prod read replica (you MUST be on the Prod VPN to run this)

```
psql --host postgresio-replica-1.ct86gtnjbztw.us-east-1.rds.amazonaws.com --db postgresio --username postgres --csv -f queries/usage.sql -o queries/results/usage.csv -b
```
