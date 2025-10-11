import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const ExpandOrder = (props: SvgProps) => (
  <Svg fill="none" {...props} height={10} width={20}>
    <Path
      fill="#154D71"
      d="m5.993 5.352 4.34-4.519 1.24 1.291-5.58 5.81-5.579-5.81 1.24-1.29 4.34 4.518Z"
    />
  </Svg>
);
export default ExpandOrder;
