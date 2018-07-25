'use strict';

import gql from 'graphql-tag';
import {graphql} from 'react-apollo';

@graphql(gql`{
  list: listPost(order: {field: "title", direction: ASC}) {
    items {
      id
      title
    }
  }
}`)
export default class extends React.Component {
  render() {
    const {list} = this.props.data;
    if (!list) {
      return <div>Loading...</div>;
    }
    return (<ul>
      {list.items.map(({title}) => (<li>{title}</li>))}
    </ul>);
  }
}
