import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Modal, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, Button, SectionHeader, EmptyState } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import { getChildFirstName } from '../../utils/helpers';
import api from '../../services/api';

interface Task {
  id: string;
  name: string;
  description?: string;
  type: 'mandatory' | 'bonus' | 'penalty';
  value: string | number;
  recurrence: 'daily' | 'weekly' | 'monthly';
  assignments?: { child_id: string; child: { name: string } }[];
}

const typeColor: Record<string, string> = {
  mandatory: Colors.taskMandatory,
  bonus: Colors.taskBonus,
  penalty: Colors.taskPenalty,
};
const typeLabel: Record<string, string> = {
  mandatory: 'Obrigatória',
  bonus: 'Bônus',
  penalty: 'Penalidade',
};
const recurrenceLabel: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Task['type']>('mandatory');
  const [value, setValue] = useState('');
  const [recurrence, setRecurrence] = useState<Task['recurrence']>('daily');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTasks, resChildren] = await Promise.all([
        api.get('/tasks'),
        api.get('/children')
      ]);
      setTasks(resTasks.data);
      setChildren(resChildren.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setName(''); setDescription(''); setType('mandatory');
    setValue(''); setRecurrence('daily'); setSelectedChildIds([]);
    setEditingTaskId(null);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setName(task.name);
    setDescription(task.description || '');
    setType(task.type);
    setValue(task.value.toString());
    setRecurrence(task.recurrence);
    const assignedIds = task.assignments?.map((a: any) => a.child_id) || [];
    setSelectedChildIds(assignedIds);
    setModalVisible(true);
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const handleSave = async () => {
    if (!name || !value) {
      showAlert('Atenção', 'Nome e valor são obrigatórios.');
      return;
    }
    const cleanValue = value.replace('R$', '').trim().replace(',', '.');
    const numericValue = parseFloat(cleanValue);
    if (isNaN(numericValue) || numericValue < 0) {
      showAlert('Atenção', 'Digite um valor numérico válido.');
      return;
    }
    if (selectedChildIds.length === 0) {
      showAlert('Atenção', 'Selecione pelo menos uma criança para atribuir a tarefa.');
      return;
    }

    setSaving(true);
    try {
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, { name, description, type, value: numericValue, recurrence, childIds: selectedChildIds });
      } else {
        await api.post('/tasks', { name, description, type, value: numericValue, recurrence, childIds: selectedChildIds });
      }
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (e: any) {
      showAlert('Erro', e.response?.data?.error || 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  const TypePicker = () => (
    <View style={styles.segmentGroup}>
      {(['mandatory', 'bonus', 'penalty'] as Task['type'][]).map(t => (
        <TouchableOpacity
          key={t}
          style={[styles.segment, type === t && { backgroundColor: typeColor[t] }]}
          onPress={() => {
            setType(t);
            if (t !== 'mandatory') setRecurrence('daily');
          }}
        >
          <Text style={[styles.segmentText, type === t && { color: '#fff' }]}>{typeLabel[t]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const RecurrencePicker = () => (
    <View style={styles.segmentGroup}>
      {(['daily', 'weekly', 'monthly'] as Task['recurrence'][]).map(r => (
        <TouchableOpacity
          key={r}
          style={[styles.segment, recurrence === r && { backgroundColor: Colors.primary }]}
          onPress={() => setRecurrence(r)}
        >
          <Text style={[styles.segmentText, recurrence === r && { color: '#fff' }]}>{recurrenceLabel[r]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const toggleChild = (id: string) => {
    setSelectedChildIds(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const ChildrenPicker = () => (
    <View style={styles.childPickerCont}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {children.map(child => {
          const isSelected = selectedChildIds.includes(child.id);
          return (
            <TouchableOpacity
              key={child.id}
              style={[styles.childChip, isSelected && styles.childChipActive]}
              onPress={() => toggleChild(child.id)}
            >
              <Text style={styles.childChipText}>{getChildFirstName(child.name)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tarefas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tasks.length === 0 && !loading ? (
          <EmptyState emoji="📋" title="Nenhuma tarefa criada" subtitle='Toque em "+" para criar a primeira tarefa.' />
        ) : (
          tasks.map(task => (
            <Card key={task.id}>
              <View style={styles.taskRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.taskTitleRow}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Badge label={typeLabel[task.type]} color={typeColor[task.type]} />
                  </View>
                  {task.description && (
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  )}
                  <View style={styles.taskMeta}>
                    <Ionicons name="repeat" size={12} color={Colors.textSecondary} />
                    <Text style={styles.taskMetaText}>{recurrenceLabel[task.recurrence]}</Text>
                    <Ionicons name="cash-outline" size={12} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
                    <Text style={styles.taskMetaText}>R$ {Number(task.value).toFixed(2)}</Text>
                  </View>
                  {task.assignments && task.assignments.length > 0 && (
                    <Text style={styles.assignedText}>
                      Para: {task.assignments.map((a: any) => getChildFirstName(a.child?.name || '')).join(', ')}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => openEditModal(task)} style={{ padding: 8 }}>
                  <Ionicons name="create-outline" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: Spacing.md }}>
            <Text style={styles.label}>Nome da Tarefa *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Lavar a louça" />

            <Text style={styles.label}>Descrição</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription}
              placeholder="Detalhes opcionais..." multiline />

            <Text style={styles.label}>Tipo *</Text>
            <TypePicker />

            <Text style={styles.label}>Valor (R$) *</Text>
            <TextInput style={styles.input} value={value} onChangeText={setValue}
              placeholder="Ex: 5.00" keyboardType="numeric" />

            {type === 'mandatory' && (
              <>
                <Text style={styles.label}>Recorrência *</Text>
                <RecurrencePicker />
              </>
            )}

            <Text style={styles.label}>Atribuir a *</Text>
            <ChildrenPicker />
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
  headerTitle: { ...Typography.h2 },
  addBtn: {
    backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  taskName: { ...Typography.bodyBold, flex: 1 },
  taskDesc: { ...Typography.caption, marginBottom: 6 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { ...Typography.caption, marginRight: 2 },
  // Modal
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
  segmentGroup: { flexDirection: 'row', borderRadius: BorderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.background },
  segmentText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  childPickerCont: { flexDirection: 'row', marginTop: 8 },
  childChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.border, marginRight: 8 },
  childChipActive: { backgroundColor: Colors.primary },
  childChipText: { ...Typography.captionBold, color: '#fff' },
  assignedText: { ...Typography.caption, color: Colors.primary, marginTop: 4, fontWeight: 'bold' }
});
