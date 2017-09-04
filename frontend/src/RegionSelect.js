/**
 * WIP
 */

import React from 'react';
import styled from 'styled-components';
import Radio from 'material-ui/Radio';
import {compose, withHandlers, withState} from 'recompose';
import theme from './theme';
import map from './map.svg';

const Container = styled.div`
width: 100%;
max-width: 750px;
position: relative;
box-sizing: border-box;

&:after {
  padding-top: 53.71%;
  display: block;
  content: '';
}
`;

const BigImg = styled.img`
width: 100%;
height: 100%;
position: absolute;
top: 0;
left: 0;
`;

const RegionCircle = styled.circle``;
const RegionHighlight = styled.circle``;
const Region = styled(({x, y, ...props}) => (
  <svg focusable={false} width={20} viewBox='0 0 20 20' {...props}>
    <RegionCircle cx={10} cy={10} r={6}/>
    <RegionHighlight cx={10} cy={10} r={9}/>
  </svg>
))`
width: ${props => props.selected ? 3 : 2}%;
position: absolute;
top: ${props => props.y}%;
left: ${props => props.x}%;
cursor: pointer;

> ${RegionCircle} {
  fill: ${theme.palette.primary[500]};
}

> ${RegionHighlight} {
  fill: transparent;
  stroke: ${theme.palette.primary[500]};
  stroke-width: 2px;
}
`;

const Region2 = styled(Radio)`
position: absolute;
top: ${props => props.y}%;
left: ${props => props.x}%;
`;

const regions = [
  {name: 'us-west', x: 9, y: 30},
  {name: 'us-central', x: 15, y: 30},
  {name: 'us-east', x: 20, y: 28},
  {name: 'eu-west', x: 50, y: 30},
  {name: 'asia-east', x: 80, y: 30},
  {name: 'asia-northeast', x: 80, y: 30},
  {name: 'asia-southeast', x: 80, y: 30},
  {name: 'australia-southeast', x: 80, y: 30}
];

function RegionSelect({onChange, selected}) {
  return (
    <Container>
      <BigImg src={map} alt='map' />

      {regions.map((props, idx) => (
        <Region2
          key={idx}
          checked={props.name === selected}
          onChange={onChange}
          value={props.name}
          aria-label={props.name}
          {...props}/>
      ))}
    </Container>
  );
}

const enhance = compose(
  withState('selected', 'setSelected', 'us-west'),
  withHandlers({
    onChange: props => event => {
      props.setSelected(event.target.value);
      props.onChange && props.onChange(event.target.value);
    }
  })
);

export default enhance(RegionSelect);
