import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Badge, EmptyState, SectionHeader } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import { AuthContext } from '../../store/AuthContext';
import api from '../../services/api';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  cost_in_xp: number;
  max_redeems: number | null;
}

interface Redemption {
  id: string;
  reward_id: string;
  cost: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function ChildStoreScreen() {
  const { user } = useContext(AuthContext);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [history, setHistory] = useState<Redemption[]>([]);
  const [availableXp, setAvailableXp] = useState(0);
  const [loading, setLoading] = useState(false);

  // We fetch standard daily executions to figure out XP limit, OR we query the backend API 's history?
  // Let's compute XP from the /executions?date=... and /adjustments/history?childId=...
  const fetchStoreData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [execRes, histRes, reqRes, redemptionsRes] = await Promise.all([
        api.get(`/executions?date=${today}`),
        api.get(`/adjustments/history?childId=${user.id}&limit=12`),
        api.get('/rewards'),
        api.get('/rewards/my-redemptions'),
      ]);

      setRewards(reqRes.data);
      setHistory(redemptionsRes.data);

      const totalHistoryXP = histRes.data.reduce((sum: number, m: any) => {
        return sum + (m.breakdown.earnedXP || 0);
      }, 0);

      const spentXp = redemptionsRes.data.reduce((sum: number, r: any) => {
        return r.status !== 'rejected' ? sum + r.cost : sum;
      }, 0);

      setAvailableXp(Math.max(0, totalHistoryXP - spentXp));
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchStoreData(); }, [fetchStoreData]);

  const handleRedeem = async (reward: Reward) => {
    if (availableXp < reward.cost_in_xp) {
      const msg = 'Você não tem XP suficiente para este prêmio ainda!';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Saldo Insuficiente', msg);
      return;
    }

    const title = 'Resgatar Prêmio';
    const message = `Deseja gastar ${reward.cost_in_xp} XP em "${reward.name}"? O seu responsável será notificado para aprovação.`;

    const proceed = async () => {
      try {
        await api.post(`/rewards/${reward.id}/redeem`);
        if (Platform.OS === 'web') window.alert('Sucesso! Pedido enviado ao seu responsável.');
        else Alert.alert('Sucesso!', 'Pedido enviado ao seu responsável.');
        fetchStoreData();
      } catch (e: any) {
        const errorMsg = e.response?.data?.error || 'Erro ao resgatar o prêmio.';
        if (Platform.OS === 'web') window.alert(errorMsg);
        else Alert.alert('Ops', errorMsg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        await proceed();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: proceed }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loja de Prêmios</Text>
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={16} color={Colors.xpGold} />
          <Text style={styles.xpText}>{availableXp} XP</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStoreData} tintColor={Colors.primary} />}
      >
        <SectionHeader title="Disponíveis para Resgate" />
        {rewards.length === 0 && !loading ? (
          <EmptyState emoji="🛍️" title="Loja Vazia" subtitle="Seu responsável ainda não adicionou prêmios." />
        ) : (
          rewards.map(reward => (
            <Card key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardContent}>
                <Ionicons name="gift" size={36} color={Colors.xpGold} style={{ marginRight: Spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardName}>{reward.name}</Text>
                  {reward.description ? <Text style={styles.rewardDesc}>{reward.description}</Text> : null}
                  <Text style={styles.costText}>{reward.cost_in_xp} XP</Text>
                </View>
              </View>
              <Button 
                title={availableXp >= reward.cost_in_xp ? "Resgatar" : "Falta XP"} 
                variant={availableXp >= reward.cost_in_xp ? "primary" : "secondary"}
                onPress={() => handleRedeem(reward)}
                disabled={availableXp < reward.cost_in_xp}
              />
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: '#16213E', borderBottomWidth: 1, borderBottomColor: '#1F1F3E',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.xpGold + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  xpText: { color: Colors.xpGold, fontWeight: '800', fontSize: 15 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  rewardCard: { backgroundColor: '#1F1F3E', marginBottom: Spacing.md, padding: Spacing.md },
  rewardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  rewardName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  rewardDesc: { fontSize: 13, color: '#A0A0B0', marginTop: 4 },
  costText: { fontSize: 14, fontWeight: '700', color: Colors.xpGold, marginTop: 8 },
});
