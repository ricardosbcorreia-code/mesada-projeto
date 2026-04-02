import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../store/AuthContext';
import { Badge, EmptyState } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import api from '../../services/api';

const taskTypeLabel: Record<string, string> = {
  mandatory: 'Obrigatória',
  bonus: 'Bônus',
  penalty: 'Penalidade',
};
const taskTypeColor: Record<string, string> = {
  mandatory: Colors.taskMandatory,
  bonus: Colors.taskBonus,
  penalty: Colors.taskPenalty,
};

interface Execution {
  id: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  date: string;
  assignment: {
    task: { name: string; description: string | null; type: string; value: string | number };
    child?: { name: string };
  };
}

export default function ChecklistScreen() {
  const { user } = useContext(AuthContext);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/executions?date=${today}`);
      setExecutions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const markComplete = async (exec: Execution) => {
    if (exec.status !== 'pending') {
      Alert.alert(
        exec.status === 'completed' ? 'Aguardando aprovação...' : 'Tarefa ' + exec.status,
        exec.status === 'completed' ? 'O responsável irá revisar sua tarefa!' : 'Esta tarefa já foi processada.'
      );
      return;
    }
    try {
      await api.patch(`/executions/${exec.id}/status`, { status: 'completed' });
      setExecutions(prev => prev.map(e => e.id === exec.id ? { ...e, status: 'completed' } : e));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
    }
  };

  const statusIcon = (status: Execution['status']) => {
    if (status === 'approved') return { name: 'checkmark-circle' as const, color: Colors.success };
    if (status === 'completed') return { name: 'time' as const, color: Colors.primary };
    if (status === 'rejected') return { name: 'close-circle' as const, color: Colors.danger };
    return { name: 'ellipse-outline' as const, color: Colors.textLight };
  };

  const statusLabel: Record<Execution['status'], string> = {
    pending: 'Pendente',
    completed: 'Aguardando',
    approved: 'Aprovada ✓',
    rejected: 'Rejeitada',
  };

  const mandatoryTasks = executions.filter(e => e.assignment?.task?.type === 'mandatory');
  const bonusTasks = executions.filter(e => e.assignment?.task?.type === 'bonus');
  const penaltyTasks = executions.filter(e => e.assignment?.task?.type === 'penalty' && e.status !== 'pending');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tarefas do Dia 📋</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{executions.filter(e => e.status === 'pending').length} pendentes</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTasks} tintColor={Colors.secondary} />}
      >
        {executions.length === 0 && !loading && (
          <EmptyState emoji="🎉" title="Nenhuma tarefa hoje!" subtitle="Aproveite seu dia livre e descanse." />
        )}

        {/* Task Item Component Function inside render */}
        {(() => {
          const renderTask = (exec: any) => {
            const icon = statusIcon(exec.status);
            const isDone = exec.status !== 'pending';
            
            return (
              <TouchableOpacity
                key={exec.id}
                style={[styles.taskCard, isDone && styles.taskCardDone]}
                activeOpacity={0.75}
              >
                <View style={styles.taskLeft}>
                  <Ionicons name={icon.name} size={26} color={icon.color} />
                </View>
                <View style={styles.taskContent}>
                  <View style={styles.taskTitleRow}>
                    <Text style={[styles.taskName, isDone && styles.taskNameDone]}>
                      {exec.assignment?.task?.name || 'Tarefa'}
                    </Text>
                    {!isDone && (
                      <Badge
                        label={taskTypeLabel[exec.assignment?.task?.type] ?? exec.assignment?.task?.type}
                        color={taskTypeColor[exec.assignment?.task?.type] ?? Colors.primary}
                      />
                    )}
                  </View>
                  {!isDone && exec.assignment?.task?.description && (
                    <Text style={styles.taskDesc}>{exec.assignment.task.description}</Text>
                  )}
                  <Text style={[styles.taskValue, isDone && { color: icon.color }, exec.assignment?.task?.type === 'penalty' && { color: Colors.danger }]}>
                    {isDone ? statusLabel[exec.status as Execution['status']] : `${exec.assignment?.task?.type === 'penalty' ? '-' : '+'}${Number(exec.assignment?.task?.value ?? 0).toFixed(2)} pts`}
                  </Text>

                  {/* Inline checklist for tasks */}
                  {exec.assignment?.task?.subtasks && exec.assignment.task.subtasks.length > 0 && !isDone && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: '#A0A0B0', fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                        CHECKLIST ({ (exec.subtask_completions || []).filter((c: any) => c.checked).length }/{ exec.assignment.task.subtasks.length }):
                      </Text>
                      {exec.assignment.task.subtasks.map((st: any) => {
                        const completion = (exec.subtask_completions || []).find((c: any) => c.subtask_id === st.id);
                        const isChecked = completion?.checked || false;
                        return (
                          <TouchableOpacity
                            key={st.id}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                            onPress={async () => {
                              try {
                                await api.patch(`/executions/${exec.id}/subtasks/${st.id}`, { checked: !isChecked });
                                loadTasks();
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
                  )}
                </View>
                {!isDone && (
                  <View style={styles.taskRight}>
                    <TouchableOpacity style={styles.completeBtn} onPress={() => markComplete(exec)}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          };

          return (
            <>
              {mandatoryTasks.length > 0 && (
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={styles.sectionLabel}>⚠️ Obrigatórias</Text>
                  {mandatoryTasks.map(renderTask)}
                </View>
              )}

              {bonusTasks.length > 0 && (
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={styles.sectionLabel}>✨ Oportunidades (Bônus)</Text>
                  {bonusTasks.map(renderTask)}
                </View>
              )}

              {penaltyTasks.length > 0 && (
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={styles.sectionLabel}>🚫 Penalidades Aplicadas</Text>
                  {penaltyTasks.map(renderTask)}
                </View>
              )}
            </>
          );
        })()}
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16213E',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#2D2D4E',
  },
  taskCardDone: { opacity: 0.7 },
  taskLeft: { width: 36, alignItems: 'center' },
  taskContent: { flex: 1, marginHorizontal: Spacing.sm },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 },
  taskName: { color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 },
  taskNameDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  taskDesc: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  taskValue: { color: Colors.xpGold, fontSize: 12, fontWeight: '700' },
  taskRight: { paddingLeft: 4 },
  completeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
  },
});
