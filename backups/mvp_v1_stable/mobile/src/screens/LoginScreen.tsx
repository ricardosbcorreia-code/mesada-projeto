import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../store/AuthContext';
import { Button } from '../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import api from '../services/api';

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useContext(AuthContext);
  const [isParent, setIsParent] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (isParent) {
        if (!email || !password) {
          Alert.alert('Atenção', 'Preencha e-mail e senha.');
          return;
        }
        const res = await api.post('/auth/login', { email, password });
        await signIn(res.data.token, res.data.parent, 'parent');
      } else {
        if (!email || !pin || pin.length < 4) {
          Alert.alert('Atenção', 'Insira o e-mail do responsável e seu PIN de 4 dígitos.');
          return;
        }
        const res = await api.post('/auth/child-login', { parentEmail: email, pin });
        await signIn(res.data.token, res.data.child, 'child');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Verifique suas credenciais e tente novamente.';
      if (Platform.OS === 'web') {
        window.alert('Erro ao entrar: ' + msg);
      } else {
        Alert.alert('Erro ao entrar', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <Text style={styles.brandEmoji}>🏆</Text>
            <Text style={styles.title}>Tarefa & Mesada</Text>
            <Text style={styles.tagline}>Responsabilidade que vira dinheiro!</Text>
          </View>

          {/* Role Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleTab, isParent && styles.toggleTabActive]}
              onPress={() => setIsParent(true)}
            >
              <Text style={styles.toggleIcon}>👨‍👩‍👧</Text>
              <Text style={[styles.toggleText, isParent && styles.toggleTextActive]}>Responsável</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, !isParent && { ...styles.toggleTabActive, backgroundColor: Colors.secondary }]}
              onPress={() => setIsParent(false)}
            >
              <Text style={styles.toggleIcon}>⭐</Text>
              <Text style={[styles.toggleText, !isParent && styles.toggleTextActive]}>Criança</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {isParent ? (
              <>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>E-mail do Responsável</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E-mail da sua família"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.label}>PIN Secreto</Text>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  placeholder="••••"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
                <Text style={styles.hint}>Seu PIN de 4 dígitos.</Text>
              </>
            )}

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              variant={isParent ? 'primary' : 'secondary'}
              style={{ marginTop: Spacing.md }}
            />
          </View>

          {/* Register link — only for parents */}
          {isParent && (
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Não tem conta? <Text style={styles.registerAction}>Criar conta grátis</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  brandEmoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  toggle: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: BorderRadius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  toggleTab: { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 4 },
  toggleTabActive: { backgroundColor: Colors.primary },
  toggleIcon: { fontSize: 20 },
  toggleText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  label: {
    ...Typography.captionBold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  pinInput: { fontSize: 24, textAlign: 'center', letterSpacing: 12 },
  hint: { ...Typography.caption, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
  registerLink: { marginTop: Spacing.xl, alignItems: 'center' },
  registerText: { ...Typography.body, color: Colors.textSecondary },
  registerAction: { color: Colors.primary, fontWeight: '700' },
});
