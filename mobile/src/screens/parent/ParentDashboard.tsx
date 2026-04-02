import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, Platform, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../store/AuthContext';
import { Card, Badge, SectionHeader, EmptyState, Button } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import { getChildName, getChildAvatar, getChildFirstName } from '../../utils/helpers';
import api from '../../services/api';

interface Child {
  id: string;
  name: string;
  base_allowance: string | number;
}

interface Execution {
  id: string;
  status: string;
  date: string;
  assignment: {
    task: { name: string; type: string };
    child: { name: string };
  };
}

interface Props { navigation: any; }

export default function ParentDashboard({ navigation }: Props) {
  const { user, signOut } = useContext(AuthContext);
  const [children, setChildren] = useState<Child[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Execution[]>([]);
  const [pendingPenalties, setPendingPenalties] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Child State
  const [editChildModal, setEditChildModal] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editAllowance, setEditAllowance] = useState('');
  const [savingChild, setSavingChild] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [childRes] = await Promise.all([api.get('/children')]);
      console.log('DEBUG: ParentDashboard children fetched:', childRes.data);
      setChildren(childRes.data);

      // Load today's pending executions across all children
      const today = new Date().toISOString().split('T')[0];
      const pending: Execution[] = [];
      const penalts: Execution[] = [];
      for (const child of childRes.data) {
        try {
          const execRes = await api.get(`/executions?childId=${child.id}&date=${today}`);
          const childPending = execRes.data.filter((e: any) => e.status === 'completed');
          const childPenalties = execRes.data.filter((e: any) => e.status === 'pending' && e.assignment?.task?.type === 'penalty');
          pending.push(...childPending);
          penalts.push(...childPenalties);
        } catch (execErr) {
          console.error(`Error loading execs for child ${child.id}:`, execErr);
        }
      }
      setPendingApprovals(pending);
      setPendingPenalties(penalts);
    } catch (e: any) {
      console.error('ParentDashboard load data error:', e);
      Alert.alert('Erro', e.message || 'Falha ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openEditChild = (child: Child) => {
    setEditingChildId(child.id);
    setEditName(child.name);
    setEditPin(''); 
    setEditAllowance(child.base_allowance.toString());
    setEditChildModal(true);
  };

  const handleSaveChild = async () => {
    if (!editName || !editAllowance) {
      Alert.alert('Atenção', 'Nome e mesada são obrigatórios.');
      return;
    }
    if (editPin && editPin.length !== 4) {
      Alert.alert('Atenção', 'O PIN deve ter exatamente 4 dígitos.');
      return;
    }
    setSavingChild(true);
    try {
      await api.put(`/children/${editingChildId}`, {
        name: editName,
        base_allowance: parseFloat(editAllowance),
        ...(editPin ? { pin: editPin } : {})
      });
      setEditChildModal(false);
      loadData();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao salvar a criança.');
    } finally {
      setSavingChild(false);
    }
  };

  const handleDeleteChild = async () => {
    if (!editingChildId) return;
    
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Excluir Criança',
        'Tem certeza que deseja excluir esta criança? Isso apagará todo o histórico de tarefas e recompensas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Excluir', 
            style: 'destructive', 
            onPress: async () => {
              try {
                await api.delete(`/children/${editingChildId}`);
                setEditChildModal(false);
                loadData();
              } catch (e: any) {
                Alert.alert('Erro', e.response?.data?.error || 'Erro ao excluir a criança.');
              }
            } 
          },
        ]
      );
    } else {
      if (window.confirm('Tem certeza que deseja excluir esta criança? Isso apagará todo o histórico de tarefas e recompensas.')) {
        try {
          await api.delete(`/children/${editingChildId}`);
          setEditChildModal(false);
          loadData();
        } catch (e: any) {
          Alert.alert('Erro', e.response?.data?.error || 'Erro ao excluir a criança.');
        }
      }
    }
  };

  const approveExecution = async (execId: string, approve: boolean) => {
    try {
      await api.patch(`/executions/${execId}/status`, { status: approve ? 'approved' : 'rejected' });
      setPendingApprovals(prev => prev.filter(e => e.id !== execId));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
    }
  };

  const applyPenalty = async (execId: string, apply: boolean) => {
    try {
      await api.patch(`/executions/${execId}/status`, { status: apply ? 'approved' : 'rejected' });
      setPendingPenalties(prev => prev.filter(e => e.id !== execId));
      loadData(); // To refresh allowance if displayed
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a penalidade.');
    }
  };

  const taskTypeColor: Record<string, string> = {
    mandatory: Colors.taskMandatory,
    bonus: Colors.taskBonus,
    penalty: Colors.taskPenalty,
  };
  const taskTypeLabel: Record<string, string> = {
    mandatory: 'Obrigatória',
    bonus: 'Bônus',
    penalty: 'Penalidade',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Painel do Responsável</Text>
        </View>
        <TouchableOpacity onPress={() => {
          if (Platform.OS === 'web') {
            signOut();
            window.location.reload();
          } else {
            Alert.alert('Sair', 'Deseja encerrar a sessão?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: signOut },
            ]);
          }
        }}>
          <Ionicons name="log-out-outline" size={26} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />}
      >
        {/* Children Row */}
        <SectionHeader
          title="Suas Crianças"
          action={{ label: '+ Adicionar', onPress: () => navigation.navigate('AddChild') }}
        />
        {children.length === 0 ? (
          <EmptyState emoji="👨‍👩‍👧" title="Nenhuma criança cadastrada" subtitle='Toque em "+ Adicionar" para começar' />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childRow}>
            {children.map((child) => (
              <Card key={child.id} style={styles.childCard}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>{getChildAvatar(child.name)}</Text>
                </View>
                <Text style={styles.childName} numberOfLines={2}>{getChildName(child.name)}</Text>
                <Text style={styles.childAllowance}>
                  R$ {Number(child.base_allowance).toFixed(2)}
                </Text>
                <TouchableOpacity style={styles.editChildBtn} onPress={() => openEditChild(child)}>
                  <Ionicons name="create-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.editChildText}>Editar</Text>
                </TouchableOpacity>
              </Card>
            ))}
          </ScrollView>
        )}

        {/* Pending Approvals */}
        <SectionHeader title={`Aguardando Aprovação (${pendingApprovals.length})`} />
        {pendingApprovals.length === 0 ? (
          <EmptyState emoji="✅" title="Tudo em dia!" subtitle="Nenhuma tarefa pendente de aprovação." />
        ) : (
          pendingApprovals.map((exec) => (
            <Card key={exec.id}>
              <View style={styles.approvalRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.approvalTitleRow}>
                    <Text style={styles.approvalTask}>{exec.assignment.task.name}</Text>
                    <Badge
                      label={taskTypeLabel[exec.assignment.task.type] ?? exec.assignment.task.type}
                      color={taskTypeColor[exec.assignment.task.type] ?? Colors.primary}
                    />
                  </View>
                  <Text style={styles.approvalChildLabel}>Criança: <Text style={styles.approvalChildName}>{getChildName(exec.assignment?.child?.name || 'Criança')}</Text></Text>
                </View>
                <View style={styles.approvalActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => approveExecution(exec.id, true)}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={() => approveExecution(exec.id, false)}>
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Pending Penalties */}
        <SectionHeader title={`Penalidades a Aplicar (${pendingPenalties.length})`} />
        {pendingPenalties.length === 0 ? (
          <EmptyState emoji="✅" title="Sem penalidades" subtitle="Nenhuma penalidade pendente para aplicar." />
        ) : (
          pendingPenalties.map((exec) => (
            <Card key={exec.id}>
              <View style={styles.approvalRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.approvalTitleRow}>
                    <Text style={styles.approvalTask}>{exec.assignment.task.name}</Text>
                    <Badge
                      label="Penalidade"
                      color={Colors.taskPenalty}
                    />
                  </View>
                  <Text style={styles.approvalChildLabel}>Para: <Text style={styles.approvalChildName}>{getChildName(exec.assignment?.child?.name || 'Criança')}</Text></Text>
                </View>
                <View style={styles.approvalActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger, width: 'auto', paddingHorizontal: 12, borderRadius: 8 }]} onPress={() => applyPenalty(exec.id, true)}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Aplicar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.textSecondary, width: 'auto', paddingHorizontal: 12, borderRadius: 8 }]} onPress={() => applyPenalty(exec.id, false)}>
                     <Text style={{ color: '#fff', fontWeight: 'bold' }}>Perdoar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Edit Child Modal */}
      <Modal visible={editChildModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditChildModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSaveChild} disabled={savingChild}>
              <Text style={[styles.modalSave, savingChild && { opacity: 0.5 }]}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: Spacing.md }}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Nome da Criança" />

            <Text style={styles.label}>Novo PIN (Opcional)</Text>
            <TextInput style={styles.input} value={editPin} onChangeText={setEditPin} placeholder="Em branco mantêm o atual" keyboardType="number-pad" maxLength={4} secureTextEntry />
            <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 16 }}>Apenas digite aqui caso queira redefinir o PIN atual da criança.</Text>

            <Text style={styles.label}>Mesada Base (R$) *</Text>
            <TextInput style={styles.input} value={editAllowance} onChangeText={setEditAllowance} placeholder="0.00" keyboardType="numeric" />

            <View style={{ marginTop: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md }}>
              <Button 
                title="Excluir Criança" 
                onPress={handleDeleteChild} 
                variant="danger" 
                small 
              />
              <Text style={{ ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                Atenção: Esta ação não pode ser desfeita.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  greeting: { ...Typography.h2 },
  subtitle: { ...Typography.caption, marginTop: 2 },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  childRow: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  childCard: {
    alignItems: 'center', padding: Spacing.sm, marginRight: Spacing.sm,
    width: 100, marginBottom: 0,
  },
  childAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  childAvatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  childName: { ...Typography.bodyBold, textAlign: 'center', fontSize: 13 },
  childAllowance: { ...Typography.caption, color: Colors.success, fontWeight: '700', marginTop: 2 },
  approvalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  approvalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  approvalTask: { ...Typography.bodyBold, flex: 1 },
  approvalChildLabel: { ...Typography.caption, marginTop: 4, color: Colors.textSecondary },
  approvalChildName: { fontWeight: '800', color: Colors.primary },
  approvalActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  editChildBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    marginTop: Spacing.sm, paddingVertical: 4, paddingHorizontal: 8, 
    backgroundColor: Colors.border, borderRadius: BorderRadius.sm 
  },
  editChildText: { ...Typography.caption, color: Colors.textSecondary },
  modal: { flex: 1, backgroundColor: Colors.card },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.h3 },
  modalCancel: { ...Typography.body, color: Colors.textSecondary },
  modalSave: { ...Typography.bodyBold, color: Colors.primary },
  modalScroll: { flex: 1 },
  label: { ...Typography.captionBold, marginBottom: 6, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    padding: 12, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  segmentText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
});
