import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const MinimizeOrderIcon = (props: SvgProps) => (
  <Svg xmlns="http://www.w3.org/2000/svg" fill="none" {...props}>
    <Path
      fill="#154D71"
      d="M5.5 3.048 1.222 6.776 0 5.71 5.5.92 11 5.71 9.778 6.776 5.5 3.048Z"
    />
  </Svg>
);
export default MinimizeOrderIcon;
