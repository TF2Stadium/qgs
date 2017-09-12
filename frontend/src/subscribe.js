import React from 'react';
import PropTypes from 'prop-types';
import {getDisplayName} from 'recompose';

export default function subscribe(
  query, {watchProps, listenTable, listenIds, variables} = {}
) {
  return Component => {
    const Watcher = class extends React.Component {
      componentWillMount() {
        this.unsub = this.context.ws.subscribe({
          query,
          listenTable,
          listenIds: listenIds(this.props),
          variables: variables(this.props)
        });
      }

      componentWillReceiveProps(nextProps) {
        let changed = false;

        for (const p of watchProps) {
          if (this.props[p] !== nextProps[p]) {
            changed = true;
          }
        }

        if (changed) {
          this.unsub();
          this.unsub = this.context.ws.subscribe({
            query,
            listenTable,
            listenIds: listenIds(nextProps),
            variables: variables(nextProps)
          });
        }
      }

      componentWillUnmount() {
        this.unsub();
      }

      render() {
        return <Component {...this.props}/>;
      }
    };

    Watcher.contextTypes = {
      ws: PropTypes.object
    };

    Watcher.displayName = `subscribe(${getDisplayName(Component)})`;

    return Watcher;
  }
}
