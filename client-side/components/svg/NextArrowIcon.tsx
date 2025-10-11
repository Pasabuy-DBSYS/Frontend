import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const NextArrowIcon = (props: any) => (
  <Svg
    widthxmlns="http://www.w3.org/2000/svg"
    fill="none"
    {...props}
    height={20}
    width={20}
  >
    <Path
      stroke="#545EE1"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.083 15.833 12.916 10 7.083 4.167"
    />
  </Svg>
);
export default NextArrowIcon;
