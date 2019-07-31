Litsor
==================
Litsor is a platform to provide and integrate API’s.
It provides GraphQL interface by default that exposes data from the internal database, or it acts as a proxy for external data sources.
Litsor also functions as an OAuth2 identity provider.
Also, it can add REST API endpoints.
Internal scripts are used to provide additional storage, processing, and integration with external API’s.
For this, it uses its scripting language that directly integrations JSON pointers and GraphQL queries.
This language is extendable with custom methods written in NodeJS,
That makes Litsor especially useful for JSON-based API’s.

## When to use it?
A typical use-case is to provide an API for web- or mobile applications
You can get up and running quickly by defining your data structure in /models/. These stores the data in a MySQL, Postgres or SQLite database. Tables are created automatically. You will also directly get a fully functional GraphQL API and OAuth2 authentication mechanism to start building your application.
Later, you can change the data storage and use external API’s or other data sources. You can do that per model, without changing the API.
Hence, applications can be developed with shorted lead times.

## Getting started
See the [Getting started guide](https://litsor.app/docs/getting-started.html).
