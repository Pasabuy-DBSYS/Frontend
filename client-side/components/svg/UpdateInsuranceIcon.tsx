import * as React from "react";
import { Circle } from "react-native-maps";
import Svg, { Path } from "react-native-svg";
const UpdateInsuranceIcon = (props: any) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    {...props}
    height={20}
    width={20}
  >
    <Path
      fill="#545EE1"
      d="M7.333 14.667v-1h1v1h-1Zm-3.876 5.29a1 1 0 0 1-1.414-1.414l.707.707.707.707Zm3.876-.707h-1v-4.583h2v4.583h-1Zm0-4.583v1H2.75v-2h4.583v1Zm0 0 .707.707-4.583 4.583-.707-.707-.707-.707 4.583-4.583.707.707Z"
    />
    <Path
      stroke="#545EE1"
      strokeLinecap="round"
      strokeWidth={2}
      d="M11 19.25h4.25a4 4 0 0 0 4-4v-8.5a4 4 0 0 0-4-4h-8.5a4 4 0 0 0-4 4V11"
    />
    <Path
      stroke="#545EE1"
      strokeLinecap="round"
      strokeWidth={2}
      d="m7.792 7.792 2.922 4.22a2 2 0 0 0 2.872.44l1.062-.827a2 2 0 0 1 2.642.165l1.96 1.96"
    />
    <Circle cx={15.125} cy={6.875} r={1.375} fill="#545EE1" />
  </Svg>
);
export default UpdateInsuranceIcon;
