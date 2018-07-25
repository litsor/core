'use strict';

import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';

@graphql(gql`query ($id: ID!) {
  item: Post(id: $id) {
    id
    title
  }
}`, {
  options: ({id}) => ({
    variables: {id}
  })
})
export default class extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  }

  render() {
    const {item} = this.props.data;
    if (!item) {
      return <div>Loading...</div>;
    }
    return <h1>{item.title}</h1>;
  }
}
