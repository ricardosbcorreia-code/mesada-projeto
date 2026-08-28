import React, { useState, useRef, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Button } from '../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import api from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
  route: RouteProp<RootStackParamList, 'ResetPassword'>;
};

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;

  // 6-digit code input — one box per digit
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDigitChange = (value: string, index: number) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = sanitized;
    setDigits(newDigits);
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos recebido por e-mail.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      Alert.alert(
        '✅ Senha redefinida!',
        'Sua nova senha foi salva. Faça login com ela agora.',
        [{ text: 'Ir para Login', onPress: () => navigation.navigate('Login') }],
      );
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Código reenviado', 'Verifique seu e-mail e tente novamente.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      Alert.alert('Erro', 'Não foi possível reenviar o código.');
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
          <Text style={styles.headerTitle}>Nova Senha</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Ionicons name="mail-open-outline" size={52} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Digite o código</Text>
          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para{'\n'}
            <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{email}</Text>
          </Text>

          {/* 6-digit code input */}
          <View style={styles.codeRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputRefs.current[i] = ref; }}
                style={[styles.codeBox, digit ? styles.codeBoxFilled : null]}
                value={digit}
                onChangeText={v => handleDigitChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleDigitKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
            <Text style={styles.resendText}>Não recebeu? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Reenviar código</Text></Text>
          </TouchableOpacity>

          {/* New password */}
          <Text style={styles.label}>Nova Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Repita a senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          <Button
            title="Redefinir Senha"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: Spacing.lg }}
          />
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
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primaryLight ?? '#e6fafa',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  title: { ...Typography.h1, textAlign: 'center', marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 22 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: Spacing.sm },
  codeBox: {
    width: 46, height: 56,
    borderWidth: 2, borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    textAlign: 'center', fontSize: 24, fontWeight: '700',
    backgroundColor: Colors.card, color: Colors.textPrimary,
  },
  codeBoxFilled: { borderColor: Colors.primary },
  resendBtn: { alignItems: 'center', marginBottom: Spacing.lg, marginTop: 4 },
  resendText: { ...Typography.body, color: Colors.textSecondary },
  label: {
    ...Typography.captionBold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 6, marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.sm,
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 15 },
  eyeIcon: { padding: 14 },
});
