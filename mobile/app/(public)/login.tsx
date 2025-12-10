import 'nativewind/nativewind';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = () => {
    // TODO: Implementar lógica de autenticação
    router.replace('/(app)/(tabs)/dashboard');
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-12 justify-center">
        <Text className="text-3xl font-bold text-center text-cyan-600 mb-2">
          BoraSiô
        </Text>
        <Text className="text-center text-gray-600 mb-8">
          Sua Clínica Online
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

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Senha
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="••••••••"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="bg-cyan-600 rounded-lg py-3 items-center mt-6"
            onPress={handleLogin}
          >
            <Text className="text-white font-semibold text-lg">Entrar</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-gray-600">Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(public)/cadastro')}>
              <Text className="text-cyan-600 font-semibold">Cadastre-se</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(public)/recuperar-senha')}>
            <Text className="text-center text-cyan-600 mt-4">
              Esqueceu sua senha?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
