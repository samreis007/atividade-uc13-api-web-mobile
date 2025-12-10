import 'nativewind/nativewind';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function RecuperarSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleRecuperar = () => {
    // TODO: Implementar lógica de recuperação de senha
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-12 justify-center">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-cyan-600 font-semibold">← Voltar</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-cyan-600 mb-2">
          Recuperar Senha
        </Text>
        <Text className="text-gray-600 mb-8">
          Digite seu email para receber um link de recuperação
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity
            className="bg-cyan-600 rounded-lg py-3 items-center mt-6"
            onPress={handleRecuperar}
          >
            <Text className="text-white font-semibold text-lg">
              Enviar Link
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
