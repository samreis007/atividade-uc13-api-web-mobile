import 'nativewind/nativewind';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleCadastro = () => {
    // TODO: Implementar lógica de cadastro
    router.replace('/(public)/login');
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-12">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-cyan-600 font-semibold">← Voltar</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-cyan-600 mb-8">
          Criar Conta
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Nome Completo
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Seu nome"
              value={nome}
              onChangeText={setNome}
            />
          </View>

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

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Confirmar Senha
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="••••••••"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="bg-cyan-600 rounded-lg py-3 items-center mt-6"
            onPress={handleCadastro}
          >
            <Text className="text-white font-semibold text-lg">Cadastrar</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-gray-600">Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(public)/login')}>
              <Text className="text-cyan-600 font-semibold">Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
