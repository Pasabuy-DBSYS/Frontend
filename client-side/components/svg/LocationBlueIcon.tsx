import * as React from "react";
import Svg, { SvgProps, G, Path, Defs, ClipPath } from "react-native-svg";
const LocationBlueIcon = (props: SvgProps) => (
  <Svg  fill="none" {...props}>
    <G clipPath="url(#a)">
      <Path
        fill="#154D71"
        d="m10 17.417 4.125-4.125a5.832 5.832 0 1 0-8.25 0L10 17.417Zm0 2.356L4.697 14.47a7.5 7.5 0 1 1 10.606 0L10 19.773Zm0-8.94a1.666 1.666 0 1 0 0-3.332 1.666 1.666 0 0 0 0 3.332Zm0 1.667a3.333 3.333 0 1 1 0-6.667 3.333 3.333 0 0 1 0 6.667Z"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h20v20H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default LocationBlueIcon;
