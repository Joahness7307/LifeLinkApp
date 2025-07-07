import { Audio } from 'expo-av';

let sound;

export async function playNotificationSound() {
  try {
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }
    sound = new Audio.Sound();
    await sound.loadAsync(require('../assets/sounds/notif-sound.mp3'));
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        sound = null;
      }
    });
  } catch (e) {
    console.log('Failed to play sound', e);
  }
}