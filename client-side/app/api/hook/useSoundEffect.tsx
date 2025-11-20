// useSoundEffect.ts
import { Audio } from "expo-av";
import { useCallback } from "react";

export const useSoundEffect = (soundFile: any) => {
  const play = useCallback(async () => {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();
  }, []);

  return { play };
};
