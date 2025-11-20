import * as React from "react";
import Svg, { SvgProps, Circle, Path } from "react-native-svg";
const EditOrder = (props: SvgProps) => (
  <Svg fill="none" {...props}>
    <Circle cx={32} cy={32} r={32} fill="#545EE1" />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m33.875 21.75 4.375 4.375m-7.292 16.042h11.667M19.29 36.333l-1.458 5.834 5.833-1.459 16.897-16.896a2.917 2.917 0 0 0 0-4.124l-.251-.251a2.917 2.917 0 0 0-4.124 0L19.29 36.333Z"
    />
  </Svg>
);
export default EditOrder;
