'use strict';

module.exports = {
  mode: 'production',

  entry: {
    'hello-world': ['./src/hello-world.js'],
    'list-posts': ['./src/list-posts.js'],
    'read-post': ['./src/read-post.js']
  },

  target: 'node',

  output: {
    library: '',
    libraryTarget: 'commonjs'
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['react',
            ['env', {
              targets: {
                node: '8.9.3'
              }
            }]
          ],
          plugins: [
            'syntax-object-rest-spread',
            'transform-decorators-legacy',
            'transform-object-rest-spread',
            'transform-function-bind',
            'transform-class-properties',
            'babel-plugin-react-require'
          ]
        }
      }
    ]
  }
};
