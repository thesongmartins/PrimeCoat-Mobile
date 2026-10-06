import { forwardRef, useState, type ComponentProps } from "react";
import { Pressable, type TextInput } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { TextField } from "./TextField";

type Props = Omit<ComponentProps<typeof TextField>, "secureTextEntry" | "trailing">;

/** TextField with a show/hide toggle. */
export const PasswordField = forwardRef<TextInput, Props>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      ref={ref}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} color={colors.mute} /> : <Eye size={18} color={colors.mute} />}
        </Pressable>
      }
    />
  );
});
