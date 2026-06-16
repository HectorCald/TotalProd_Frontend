import React from 'react';
import BotonNormal from './botones/Boton';
import BotonIcon from './botones/BotonIcon';

export default function Boton(props) {
  if (props.buttonIcon || props.hideTextOnMobile) {
    if (!props.label) {
      return <BotonIcon {...props} />;
    }
  }
  return <BotonNormal {...props} iconName={props.buttonIcon || props.iconName} />;
}