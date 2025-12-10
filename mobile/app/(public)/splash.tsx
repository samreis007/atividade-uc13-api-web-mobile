import 'nativewind/nativewind';
import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';

export default function Splash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      router.replace('/(public)/login');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [opacity, router]);

  return (
    <View className="flex-1 items-center justify-center bg-gradient-to-br from-cyan-600 to-teal-600">
      <Animated.View style={{ opacity }}>
        <Text className="text-white text-4xl font-bold text-center">
          BoraSiô
        </Text>
        <Text className="text-white text-lg text-center mt-4">
          Sua Clínica Online
        </Text>
      </Animated.View>
    </View>
  );
}
