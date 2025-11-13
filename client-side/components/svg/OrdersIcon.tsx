import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const OrdersIcon = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    {...props}
    height={24}
    width={24}
  >
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth={2.417}
      d="M8.667 8.666V7.583a4.333 4.333 0 0 1 8.667 0v1.083M16.25 15.167V13M9.75 15.167V13"
    />
    <Path
      stroke="#fff"
      strokeWidth={2.417}
      d="M4.333 13.36c0-2.143 0-3.214.632-3.907.05-.054.101-.105.155-.154.692-.633 1.764-.633 3.907-.633h7.945c2.143 0 3.215 0 3.908.633.053.049.105.1.154.154.632.693.632 1.764.632 3.908v.722c0 3.593 0 5.39-.907 6.653-.307.426-.68.8-1.106 1.106-1.264.908-3.06.908-6.653.908-3.593 0-5.39 0-6.653-.908-.427-.306-.8-.68-1.106-1.106-.908-1.264-.908-3.06-.908-6.653v-.722Z"
    />
  </Svg>
);
export default OrdersIcon;
