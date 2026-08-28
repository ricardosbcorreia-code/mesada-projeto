import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button } from '../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import api from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe o seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });

      if (res.data.hint === 'google_account') {
        Alert.alert(
          'Conta Google',
          'Esta conta foi criada com o Google. Para acessar, use o botão "Entrar com Google".',
        );
        return;
      }

      // Navigate to code entry screen regardless (don't reveal if email exists)
      navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Não foi possível enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Esqueci a Senha</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Ionicons name="lock-open-outline" size={56} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Recuperar acesso</Text>
          <Text style={styles.subtitle}>
            Digite o e-mail cadastrado. Enviaremos um código de 6 dígitos para você criar uma nova senha.
          </Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />

          <Button
            title="Enviar código"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: Spacing.lg }}
          />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Lembrou a senha? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Entrar</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3 },
  content: { flex: 1, padding: Spacing.md, paddingTop: Spacing.xl },
  iconWrapper: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight ?? '#e6fafa',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h1, textAlign: 'center', marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  label: {
    ...Typography.captionBold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 6, marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.sm,
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  backLink: { marginTop: Spacing.xl, alignItems: 'center' },
  backLinkText: { ...Typography.body, color: Colors.textSecondary },
});
