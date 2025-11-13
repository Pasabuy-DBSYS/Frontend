import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const DeliverProfileIcon = (props: SvgProps) => (
  <Svg fill="none" {...props}>
    <Path
      stroke="#545EE1"
      strokeLinecap="round"
      strokeWidth={1.95}
      d="M13.066 4.934c1.957 0 3.381 1.423 3.381 2.986 0 1.563-1.424 2.984-3.38 2.984-1.957 0-3.381-1.421-3.381-2.984s1.424-2.986 3.38-2.986ZM5.27 16.811c.708-2.388 3.236-3.447 5.726-3.447h4.142c2.49 0 5.019 1.06 5.726 3.447.13.44.235.912.3 1.412.076.593-.415 1.08-1.014 1.08H5.984c-.599 0-1.09-.487-1.014-1.08.065-.5.17-.972.3-1.412Z"
    />
  </Svg>
);
export default DeliverProfileIcon;
