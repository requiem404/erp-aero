## Project setup

```bash
$ yarn install
```

## Add the env file to the root of the project.
```
PORT=3007

# DB
MYSQL_HOST='localhost'
MYSQL_PORT=3306
MYSQL_USER='root'
MYSQL_PASSWORD='qwertyzxc'
MYSQL_DB='erp-aero'

# JWT
JWT_SECRET='b0fc6ce7aad1d80b9d79655d35d3023fe6ba1f92c5607bda68342835fca84d02'
JWT_ACCESS_TOKEN_TTL='10m'
JWT_REFRESH_TOKEN_TTL='7d'
```
## DB setup

```bash
$ docker-compose up
```


## Compile and run the project
```bash
$ yarn run start:dev
```

## Open swagger
`http://localhost:3007/api`