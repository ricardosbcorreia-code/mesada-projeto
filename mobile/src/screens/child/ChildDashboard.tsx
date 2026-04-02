import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../store/AuthContext';
import { Card, ProgressBar, EmptyState, SectionHeader } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import { getChildFirstName, getChildAvatar } from '../../utils/helpers';
import api from '../../services/api';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000];

export default function ChildDashboard() {
  const { user, signOut } = useContext(AuthContext);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [execRes, histRes] = await Promise.all([
         api.get(`/executions?date=${today}`),
         api.get(`/adjustments/history?childId=${user.id}&limit=12`)
      ]);
      setExecutions(execRes.data);
      
      const totalHistoryXP = histRes.data.reduce((sum: number, m: any) => {
        return sum + (m.breakdown.earnedXP || 0);
      }, 0);
      
      setXp(Math.max(0, totalHistoryXP));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [today, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const [xp, setXp] = useState(0);

  const approved = executions.filter(e => e.status === 'approved');
  const completed = executions.filter(e => e.status === 'completed');
  const pending = executions.filter(e => e.status === 'pending');

  const mandatoryTasks = executions.filter(e => e.assignment?.task?.type === 'mandatory');
  const bonusTasks = executions.filter(e => e.assignment?.task?.type === 'bonus');
  const penaltyTasks = executions.filter(e => e.assignment?.task?.type === 'penalty' && e.status !== 'pending');

  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  const levelXP = LEVEL_THRESHOLDS[level] ?? 0;
  const nextXP = LEVEL_THRESHOLDS[level + 1] ?? levelXP + 100;
  const progress = isNaN((xp - levelXP) / (nextXP - levelXP)) ? 0 : (xp - levelXP) / (nextXP - levelXP);

  const dayGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const StatBubble = ({ label, count, color }: { label: string; count: number; color: string }) => (
    <Card style={{ ...styles.statCard, borderTopWidth: 4, borderTopColor: color }}>
      <Text style={[styles.statNumber, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );

  const ExpandableGroup = ({ title, items, color }: { title: string; items: any[]; color: string }) => {
    const [expanded, setExpanded] = useState(true);
    if (items.length === 0) return null;

    const groupTotal = items.reduce((sum, ex) => {
      const val = Number(ex.assignment?.task?.value ?? 0) * 10;
      const type = ex.assignment?.task?.type;
      if (ex.status === 'approved') {
        return type === 'penalty' ? sum - val : sum + val;
      }
      if (type === 'mandatory' && ex.status === 'rejected') {
        return sum - val;
      }
      return sum;
    }, 0);

    return (
      <View style={{ marginBottom: Spacing.sm }}>
        <TouchableOpacity 
          style={[styles.groupHeader, { borderLeftColor: color }]} 
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.groupLabel}>{title}</Text>
            <Text style={[styles.groupTotal, { color: groupTotal >= 0 ? Colors.xpGold : Colors.danger }]}>
              {groupTotal >= 0 ? '+' : ''}{groupTotal} pts acumulados
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {expanded && (
          <View style={{ marginTop: 4 }}>
            {items.map((ex) => {
              const type = ex.assignment?.task?.type;
              const val = Number(ex.assignment?.task?.value ?? 0) * 10;
              
              let ptsLabel = '';
              if (ex.status === 'approved') {
                ptsLabel = type === 'penalty' ? `-${val} pts` : `+${val} pts`;
              } else if (type === 'mandatory' && ex.status === 'rejected') {
                ptsLabel = `-${val} pts`;
              }
              // Omit value for rejected bonus/penalty as per request

              return (
                <Card key={ex.id} style={styles.taskCard}>
                  <View style={styles.taskRow}>
                    <Ionicons
                      name={ex.status === 'approved' ? 'checkmark-circle' : ex.status === 'rejected' ? 'close-circle' : ex.status === 'completed' ? 'time' : 'ellipse-outline'}
                      size={20}
                      color={ex.status === 'approved' ? Colors.success : ex.status === 'rejected' ? Colors.danger : ex.status === 'completed' ? Colors.primary : 'rgba(255,255,255,0.3)'}
                    />
                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                      <Text style={[styles.taskName, (ex.status === 'approved' || ex.status === 'rejected') && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                         {ex.assignment?.task?.name}
                      </Text>
                      {ptsLabel !== '' && (
                        <Text style={[styles.taskValue, ptsLabel.startsWith('-') && { color: Colors.danger }]}>
                          {ptsLabel}
                        </Text>
                      )}

                      {/* Inline checklist for mandatory tasks */}
                      {ex.assignment?.task?.subtasks && ex.assignment.task.subtasks.length > 0 && (() => {
                        const checkedCount = (ex.subtask_completions || []).filter((c: any) => c.checked).length;
                        const total = ex.assignment.task.subtasks.length;
                        return (
                          <View style={{ marginTop: 8 }}>
                            <Text style={{ color: '#A0A0B0', fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                              CHECKLIST: {checkedCount}/{total}
                            </Text>
                            {ex.assignment.task.subtasks.map((st: any) => {
                              const completion = (ex.subtask_completions || []).find((c: any) => c.subtask_id === st.id);
                              const isChecked = completion?.checked || false;
                              return (
                                <TouchableOpacity
                                  key={st.id}
                                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                                  onPress={async () => {
                                    try {
                                      await api.patch(`/executions/${ex.id}/subtasks/${st.id}`, { checked: !isChecked });
                                      loadData();
                                    } catch (e) { console.error(e); }
                                  }}
                                >
                                  <Ionicons
                                    name={isChecked ? 'checkbox' : 'square-outline'}
                                    size={16}
                                    color={isChecked ? Colors.success : 'rgba(255,255,255,0.4)'}
                                  />
                                  <Text style={{ color: isChecked ? Colors.success : '#fff', fontSize: 12, textDecorationLine: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.6 : 1 }}>
                                    {st.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        );
                      })()}
                    </View>
                    <Badge 
                      label={ex.status === 'approved' ? 'OK!' : ex.status === 'rejected' ? 'X' : ex.status === 'completed' ? '...' : ''}
                      color={ex.status === 'approved' ? Colors.success : ex.status === 'rejected' ? Colors.danger : Colors.warning}
                      size="sm"
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Internal Badge for concise status
  const Badge = ({ label, color, size = 'md' }: { label: string; color: string; size?: 'sm' | 'md' }) => {
    if (!label) return null;
    return (
      <View style={{ 
        backgroundColor: color + '20', 
        paddingHorizontal: size === 'sm' ? 6 : 10, 
        paddingVertical: 2, 
        borderRadius: 4, 
        borderWidth: 1, 
        borderColor: color 
      }}>
        <Text style={{ color, fontSize: size === 'sm' ? 10 : 12, fontWeight: '800' }}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Gamified Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getChildAvatar(user?.name || '')}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{dayGreeting()}, {getChildFirstName(user?.name || '')}! ⭐</Text>
            <Text style={styles.levelText}>Nível {level + 1} · {xp} XP</Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.secondary} />}
      >
        {/* XP Progress Bar */}
        <Card style={styles.xpCard}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>⚡ Progresso XP</Text>
            <Text style={styles.xpNumbers}>{xp} / {nextXP} XP</Text>
          </View>
          <ProgressBar progress={progress} color={Colors.xpGold} height={14} style={{ marginTop: 6 }} />
        </Card>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatBubble label="Aprovadas" count={approved.length} color={Colors.success} />
          <StatBubble label="Pendentes" count={pending.length} color={Colors.warning} />
          <StatBubble label="Concluídas" count={completed.length} color={Colors.primary} />
        </View>

        <Text style={styles.sectionTitle}>🗓 Suas Tarefas</Text>
        
        {executions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>🎉 Nenhuma tarefa para hoje!</Text>
            <Text style={styles.emptySubText}>Aproveite o seu dia livre.</Text>
          </Card>
        ) : (
          <>
            <ExpandableGroup title="Obrigatórias" items={mandatoryTasks} color={Colors.taskMandatory} />
            <ExpandableGroup title="Oportunidades (Bônus)" items={bonusTasks} color={Colors.taskBonus} />
            <ExpandableGroup title="Penalidades do Dia" items={penaltyTasks} color={Colors.taskPenalty} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: '#16213E',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
  levelText: { fontSize: 12, fontWeight: '600', color: Colors.xpGold, marginTop: 2 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  logoutBtn: { padding: 4 },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  xpCard: { backgroundColor: '#16213E', marginBottom: Spacing.sm },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  xpNumbers: { fontSize: 12, color: Colors.xpGold, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12, marginBottom: 0 },
  statNumber: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#A0A0B0', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginVertical: Spacing.sm },
  taskCard: { backgroundColor: '#1F1F3E', marginBottom: 6, paddingVertical: 10 },
  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskName: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  taskValue: { color: Colors.xpGold, fontSize: 12, fontWeight: '600', marginTop: 1 },
  emptyCard: { backgroundColor: '#16213E', alignItems: 'center', padding: Spacing.lg },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySubText: { color: '#A0A0B0', marginTop: 4, textAlign: 'center' },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#16213E',
    borderRadius: BorderRadius.md, borderLeftWidth: 4,
  },
  groupLabel: { color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  groupTotal: { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  moreText: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, fontSize: 13 },
});
