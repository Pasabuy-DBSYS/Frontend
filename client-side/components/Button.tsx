import { Pressable, Text } from "react-native";
import { ButtonProps } from "../types/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import CreateAccountArrow from "./svg/CreateAccountArrow";

export const Button = ({
  title,
  onPress,
  showArrow = false,
  disabled = false,
  ...props
}: ButtonProps & { showArrow?: boolean; disabled?: boolean }) => {
  return (
    <Pressable
      onPress={onPress}
      {...props}
      disabled={disabled}
      style={{
        backgroundColor: props.backgroundColor,
        padding: props.padding,
        margin: props.margin,
        width: props.width,
        height: props.height,
        borderColor: props.borderColor,
        borderWidth: props.borderWidth,
        borderRadius: props.borderRadius,
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: "row",
        gap: showArrow ? 10 : 0, // add gap only if arrow exists
        alignItems: showArrow ? "center" : "center",
        opacity: disabled ? 0.5 : 1,
        marginTop: props.marginTop,
        marginBottom: props.marginBottom,
      }}
    >
      <Text
        style={{
          color: props.textColor,
          fontWeight: props.fontWeight,
          fontSize: props.fontSize,
        }}
      >
        {title}
      </Text>
      {showArrow && <CreateAccountArrow />}
    </Pressable>
  );
};
