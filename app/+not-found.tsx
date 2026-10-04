import { View } from "react-native";
import { router } from "expo-router";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: colors.warmWhite }}>
      <EmptyState title="Page not found" description="That screen doesn't exist." action={<Button onPress={() => router.replace("/")}>Go home</Button>} />
    </View>
  );
}
