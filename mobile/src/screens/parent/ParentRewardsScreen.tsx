import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Badge, EmptyState, SectionHeader } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import api from '../../services/api';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  cost_in_xp: number;
  max_redeems: number | null;
  redemptions: any[];
}

export default function ParentRewardsScreen() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [costInXp, setCostInXp] = useState('');
  const [maxRedeems, setMaxRedeems] = useState('');

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rewards');
      setRewards(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  const handleCreate = async () => {
    if (!name || !costInXp) {
      Alert.alert('Erro', 'Preencha o nome e o custo em XP.');
      return;
    }
    try {
      await api.post('/rewards', {
        name,
        description,
        cost_in_xp: parseInt(costInXp, 10),
        max_redeems: maxRedeems ? parseInt(maxRedeems, 10) : null
      });
      setShowForm(false);
      setName('');
      setDescription('');
      setCostInXp('');
      setMaxRedeems('');
      fetchRewards();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar o prêmio.');
    }
  };

  const handleDelete = async (id: string, rewardName: string) => {
    Alert.alert('Excluir Prêmio', `Tem certeza que quer remover "${rewardName}"?`, [
       { text: 'Cancelar', style: 'cancel' },
       { text: 'Excluir', style: 'destructive', onPress: async () => {
         try {
           await api.delete(`/rewards/${id}`);
           fetchRewards();
         } catch (e) {
           Alert.alert('Erro', 'Falha ao remover o prêmio.');
         }
       }}
    ]);
  };

  const handleRedemptionStatus = async (redemptionId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/rewards/redemptions/${redemptionId}/status`, { status });
      fetchRewards();
    } catch (e) {
      Alert.alert('Erro', 'Falha ao atualizar o status do resgate.');
    }
  };

  const pendingRedemptions = rewards.flatMap(r => 
    (r.redemptions || []).filter((red: any) => red.status === 'pending').map((red: any) => ({ ...red, rewardName: r.name }))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loja de Prêmios</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRewards} tintColor={Colors.primary} />}
      >
        {showForm && (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Novo Prêmio</Text>
            
            <Text style={styles.label}>Nome do Prêmio *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Passeio no Parque, 1 Hora de Vídeo-Game"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Custo em XP *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              keyboardType="numeric"
              value={costInXp}
              onChangeText={setCostInXp}
            />

            <Text style={styles.label}>Regras/Descrição (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Válido para o final de semana."
              value={description}
              onChangeText={setDescription}
            />

            <Button title="Salvar Prêmio" onPress={handleCreate} />
          </Card>
        )}

        {pendingRedemptions.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <SectionHeader title="Pedidos de Resgate" />
            {pendingRedemptions.map((red: any) => (
              <Card key={red.id} style={styles.redemptionCard}>
                <View style={styles.redRow}>
                  <View style={styles.redIconBox}>
                    <Ionicons name="gift-outline" size={20} color={Colors.xpGold} />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={styles.redChild}>{red.child?.name} gastou {red.cost} XP</Text>
                    <Text style={styles.redReward}>{red.rewardName}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleRedemptionStatus(red.id, 'rejected')} style={[styles.actionBtn, { backgroundColor: Colors.danger + '20' }]}>
                      <Ionicons name="close" size={20} color={Colors.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRedemptionStatus(red.id, 'approved')} style={[styles.actionBtn, { backgroundColor: Colors.success + '20' }]}>
                      <Ionicons name="checkmark" size={20} color={Colors.success} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <SectionHeader title="Prêmios Ativos" />
        
        {rewards.length === 0 && !showForm && !loading ? (
          <EmptyState 
            emoji="🎁" 
            title="Nenhum prêmio cadastrado" 
            subtitle="Toque no '+' para criar opções de recompensa e incentivar as crianças com XP."
          />
        ) : (
          rewards.map(reward => (
            <Card key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardName}>{reward.name}</Text>
                  {reward.description ? <Text style={styles.rewardDesc}>{reward.description}</Text> : null}
                </View>
                <View style={styles.costBadge}>
                  <Text style={styles.costText}>{reward.cost_in_xp} XP</Text>
                </View>
              </View>
              <View style={styles.rewardFooter}>
                <Text style={styles.rewardStats}>
                  {reward.redemptions?.length || 0} resgates
                </Text>
                <TouchableOpacity onPress={() => handleDelete(reward.id, reward.name)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h2 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  formCard: { marginBottom: Spacing.lg, backgroundColor: Colors.card, borderColor: Colors.primary, borderWidth: 1 },
  formTitle: { ...Typography.h3, marginBottom: Spacing.md },
  label: { ...Typography.captionBold, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md,
    fontSize: 15,
  },
  rewardCard: { padding: 0, marginBottom: Spacing.sm, overflow: 'hidden' },
  rewardHeader: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.card },
  rewardName: { ...Typography.bodyBold, fontSize: 16 },
  rewardDesc: { ...Typography.body, color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  costBadge: { backgroundColor: Colors.xpGold + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  costText: { color: Colors.xpGold, fontWeight: '800', fontSize: 13 },
  rewardFooter: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: 'rgba(0,0,0,0.02)',
    borderTopWidth: 1, borderTopColor: Colors.border
  },
  rewardStats: { ...Typography.captionBold, color: Colors.textSecondary },
  redemptionCard: { padding: Spacing.sm, marginBottom: 8, borderColor: Colors.xpGold, borderWidth: 1 },
  redRow: { flexDirection: 'row', alignItems: 'center' },
  redIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.xpGold + '20', alignItems: 'center', justifyContent: 'center' },
  redChild: { ...Typography.captionBold, color: Colors.textSecondary },
  redReward: { ...Typography.bodyBold, fontSize: 14, color: Colors.textPrimary },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
