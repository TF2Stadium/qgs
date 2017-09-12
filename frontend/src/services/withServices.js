import React from 'react';
import {start} from 'ineedthis';

export default function withServices(
  servicesMap,
  {loadingProp='isLoading', delayRender=false} = {}
) {
  return WrappedComponent => {
    return class extends React.Component {
      constructor() {
        super();
        const childProps = {};
        for (const k of Object.keys(servicesMap)) {
          childProps[k] = null;
        }
        childProps[loadingProp] = true;
        this.state = {childProps};
      }

      async componentWillMount() {
        let sys;
        try {
          sys = await start(Object.values(servicesMap));
        } catch (e) {
          console.error('WTF couldn\'t start services', e);
          return;
        }

        const newChildProps = {};
        for (const [prop, s] of Object.entries(servicesMap)) {
          newChildProps[prop] = sys[s.serviceName];
        }
        newChildProps[loadingProp] = false;
        this.setState(() => ({childProps: newChildProps}));
      }

      render() {
        if (delayRender && this.state.childProps[loadingProp]) {
          return null;
        }
        return <WrappedComponent {...this.props} {...this.state.childProps}/>
      }
    };
  };
}
