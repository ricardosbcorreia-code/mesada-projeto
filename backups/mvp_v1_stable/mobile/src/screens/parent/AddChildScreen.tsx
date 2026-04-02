import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import api from '../../services/api';

interface Props {
  navigation: any;
}

const PIN_EMOJIS = ['🦁', '🐯', '🐼', '🦊', '🐸', '🦄', '🐉', '🦋'];

export default function AddChildScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [baseAllowanceRaw, setBaseAllowanceRaw] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(PIN_EMOJIS[0]);
  const [loading, setLoading] = useState(false);

  const handleAllowanceChange = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setBaseAllowanceRaw(numericValue);
  };

  const handleCreate = async () => {
    if (!name || !pin || pin.length !== 4) {
      Alert.alert('Atenção', 'Nome e um PIN de 4 dígitos são obrigatórios.');
      return;
    }
    if (isNaN(Number(pin))) {
      Alert.alert('Atenção', 'O PIN deve conter apenas números.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/children', {
        name: `${selectedEmoji} ${name}`,
        pin,
        base_allowance: baseAllowanceRaw ? parseInt(baseAllowanceRaw, 10) : 0,
      });
      
      if (Platform.OS === 'web') {
        window.alert(`Sucesso! ${name} foi adicionada!`);
        navigation.goBack();
      } else {
        Alert.alert('Sucesso! 🎉', `${name} foi adicionada!`, [
          { text: 'Ok', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert('Erro: ' + (e.response?.data?.error || 'Não foi possível cadastrar a criança.'));
      } else {
        Alert.alert('Erro', e.response?.data?.error || 'Não foi possível cadastrar a criança.');
      }
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
          <Text style={styles.headerTitle}>Adicionar Criança</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Avatar picker */}
          <Text style={styles.label}>Escolha um Avatar</Text>
          <View style={styles.emojiRow}>
            {PIN_EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnActive]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
            </View>
            <Text style={styles.previewName}>{name || 'Nome da criança'}</Text>
          </View>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: João"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>PIN Secreto (4 dígitos)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1234"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
          <Text style={styles.hint}>A criança usará este PIN para entrar no aplicativo.</Text>

          <Text style={styles.label}>Mesada Base</Text>
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.currencyInput}
              placeholder="0"
              value={baseAllowanceRaw}
              onChangeText={handleAllowanceChange}
              keyboardType="numeric"
            />
            <Text style={styles.currencySuffix}>,00</Text>
          </View>
          <Text style={styles.hint}>Valor mensal antes de bônus e penalidades.</Text>

          <Button
            title="Adicionar Criança"
            onPress={handleCreate}
            loading={loading}
            style={{ marginTop: Spacing.xl }}
          />
        </ScrollView>
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
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  currencyInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    ...Typography.body, color: Colors.textSecondary, marginRight: Spacing.sm, fontWeight: 'bold'
  },
  currencyInput: {
    flex: 1, paddingVertical: Spacing.md, ...Typography.body,
  },
  currencySuffix: {
    ...Typography.body, color: Colors.textSecondary, marginLeft: Spacing.sm, fontWeight: 'bold'
  },
  label: {
    ...Typography.captionBold, color: Colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 6, marginTop: Spacing.md,
  },
  hint: { ...Typography.caption, color: Colors.textLight, marginTop: 4 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  emojiBtn: {
    width: 52, height: 52, borderRadius: BorderRadius.md,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: '#EBF4FF' },
  emojiText: { fontSize: 28 },
  preview: { alignItems: 'center', paddingVertical: Spacing.lg },
  previewAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.secondary + '30',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  previewEmoji: { fontSize: 42 },
  previewName: { ...Typography.h3, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.sm,
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
});
