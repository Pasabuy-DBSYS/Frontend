import * as React from "react";
import Svg, { SvgProps, Circle, Path } from "react-native-svg";
const CancelOrder = (props: SvgProps) => (
  <Svg fill="none" {...props}>
    <Circle cx={32} cy={32} r={32} fill="#545EE1" />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m21.67 45.33 9.831-9.83 9.831 9.83m0-19.66L31.5 35.5l-9.83-9.83"
    />
  </Svg>
);
export default CancelOrder;
