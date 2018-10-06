'use strict';

const {createElement} = require('react');
const {renderToStaticMarkup, renderToString} = require('react-dom/server');
const {ApolloProvider, getDataFromTree} = require('react-apollo');
const {ApolloClient} = require('apollo-client');
const {SchemaLink} = require('apollo-link-schema');
const {InMemoryCache} = require('apollo-cache-inmemory');

let clientCached;
let clientCachedDate;

module.exports = {
  name: 'React',
  requires: ['Graphql'],
  tests: [],
  binary: async ({properties, cache, prerender, extract, hydrate}, filename, {Graphql}) => {
    const component = require(filename).default;

    let client;
    const now = new Date();
    if (cache && clientCached && (now - clientCachedDate < cache * 1e3)) {
      client = clientCached;
    }
    if (!client) {
      const apolloCache = new InMemoryCache();
      if (hydrate) {
        apolloCache.restore(hydrate);
      }
      client = new ApolloClient({
        link: new SchemaLink({schema: Graphql.schema}),
        cache: apolloCache,
        ssrMode: true
      });
      if (cache) {
        clientCached = client;
        clientCachedDate = now;
      }
    }

    const element = createElement(ApolloProvider, {client},
      createElement(component, properties || {})
    );

    await getDataFromTree(element);

    const html = prerender ? renderToString(element) : renderToStaticMarkup(element);
    const output = {html};

    if (extract) {
      output.store = client.extract();
    }

    return output;
  }
};
