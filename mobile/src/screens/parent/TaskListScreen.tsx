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
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_interval: number;
  recurrence_days: number[];
  recurrence_month?: number | null;
  assignments?: { child_id: string; child: { name: string } }[];
  subtasks?: { id: string; label: string; order: number }[];
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
  yearly: 'Anual',
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

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
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Advanced Recurrence state
  const [recType, setRecType] = useState<Task['recurrence_type']>('daily');
  const [recInterval, setRecInterval] = useState(1);
  const [recDays, setRecDays] = useState<number[]>([]);
  const [recMonth, setRecMonth] = useState<number | null>(null);
  // Subtask state
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtaskItems, setSubtaskItems] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTasks, resChildren] = await Promise.all([
        api.get('/tasks'),
        api.get('/children')
      ]);
      setTasks(resTasks.data);
      console.log('DEBUG: TaskListScreen children fetched:', resChildren.data);
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
    setValue(''); setSelectedChildIds([]);
    setRecType('daily'); setRecInterval(1); setRecDays([]); setRecMonth(null);
    setSubtaskInput(''); setSubtaskItems([]);
    setEditingTaskId(null);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setName(task.name);
    setDescription(task.description || '');
    setType(task.type);
    setValue(task.value.toString());
    setRecType(task.recurrence_type);
    setRecInterval(task.recurrence_interval || 1);
    setRecDays(task.recurrence_days || []);
    setRecMonth(task.recurrence_month || null);
    const assignedIds = task.assignments?.map((a: any) => a.child_id) || [];
    setSelectedChildIds(assignedIds);
    setSubtaskItems(task.subtasks?.map(s => s.label) || []);
    setSubtaskInput('');
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
      const payload = { 
        name, description, type, value: numericValue, 
        recurrence_type: recType,
        recurrence_interval: recInterval,
        recurrence_days: recDays,
        recurrence_month: recMonth,
        childIds: selectedChildIds, 
        subtasks: subtaskItems 
      };
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
      } else {
        await api.post('/tasks', payload);
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

  const toggleChild = (id: string) => {
    setSelectedChildIds(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const addSubtaskItem = () => {
    const trimmed = subtaskInput.trim();
    if (trimmed && !subtaskItems.includes(trimmed)) {
      setSubtaskItems(prev => [...prev, trimmed]);
    }
    setSubtaskInput('');
  };

  const removeSubtaskItem = (idx: number) => {
    setSubtaskItems(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleDay = (day: number) => {
    setRecDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a,b) => a-b));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
                    <Text style={styles.taskMetaText}>
                      {recurrenceLabel[task.recurrence_type]}
                      {task.recurrence_interval > 1 && ` (a cada ${task.recurrence_interval})`}
                    </Text>
                    <Ionicons name="cash-outline" size={12} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
                    <Text style={styles.taskMetaText}>R$ {Number(task.value).toFixed(2)}</Text>
                  </View>
                  {task.assignments && task.assignments.length > 0 && (
                    <Text style={styles.assignedText}>
                      Para: {task.assignments.map((a: any) => getChildFirstName(a.child?.name || '')).join(', ')}
                    </Text>
                  )}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                      <Ionicons name="list" size={12} color={Colors.taskMandatory} />
                      <Text style={[styles.assignedText, { color: Colors.taskMandatory }]}>
                        {task.subtasks.length} itens de checklist
                      </Text>
                    </View>
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

          <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: Spacing.md }} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nome da Tarefa *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Lavar a louça" autoFocus={true} />

            <Text style={styles.label}>Descrição</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription}
              placeholder="Detalhes opcionais..." multiline />

            {/* Type picker — inlined to prevent remount */}
            <Text style={styles.label}>Tipo *</Text>
            <View style={styles.segmentGroup}>
              {(['mandatory', 'bonus', 'penalty'] as Task['type'][]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.segment, type === t && { backgroundColor: typeColor[t] }]}
                  onPress={() => { setType(t); if (t !== 'mandatory') setRecType('daily'); }}
                >
                  <Text style={[styles.segmentText, type === t && { color: '#fff' }]}>{typeLabel[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Valor (R$) *</Text>
            <TextInput style={styles.input} value={value} onChangeText={setValue}
              placeholder="Ex: 5.00" keyboardType="numeric" />

            {type === 'mandatory' && (
              <>
                <AdvancedRecurrencePicker 
                  recType={recType} 
                  setRecType={setRecType} 
                  recInterval={recInterval} 
                  setRecInterval={setRecInterval} 
                  recDays={recDays} 
                  toggleDay={(d: number) => setRecDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a,b) => a-b))} 
                  recMonth={recMonth} 
                  setRecMonth={setRecMonth} 
                  setRecDays={(d: number[]) => setRecDays(d)}
                />
                <SubtaskEditor 
                  subtaskInput={subtaskInput} 
                  setSubtaskInput={setSubtaskInput} 
                  subtaskItems={subtaskItems} 
                  addSubtaskItem={addSubtaskItem} 
                  removeSubtaskItem={removeSubtaskItem} 
                />
              </>
            )}

            {/* Children picker — inlined to prevent remount */}
            <Text style={styles.label}>Atribuir a *</Text>
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
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components for Form ──────────────────────────────────────────────────

interface SubtaskEditorProps {
  subtaskInput: string;
  setSubtaskInput: (v: string) => void;
  subtaskItems: string[];
  addSubtaskItem: () => void;
  removeSubtaskItem: (i: number) => void;
}
const SubtaskEditor = ({ subtaskInput, setSubtaskInput, subtaskItems, addSubtaskItem, removeSubtaskItem }: SubtaskEditorProps) => (
  <>
    <Text style={styles.label}>Checklist da Tarefa (opcional)</Text>
    <View style={styles.subtaskRow}>
      <TextInput
        style={[styles.input, { flex: 1, marginRight: 8 }]}
        value={subtaskInput}
        onChangeText={setSubtaskInput}
        placeholder="Ex: Caderno de matemática"
        onSubmitEditing={addSubtaskItem}
        returnKeyType="done"
        blurOnSubmit={false}
      />
      <TouchableOpacity style={styles.subtaskAddBtn} onPress={addSubtaskItem}>
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
    {subtaskItems.map((item, idx) => (
      <View key={idx} style={styles.subtaskChip}>
        <Ionicons name="checkbox-outline" size={16} color={Colors.taskMandatory} />
        <Text style={styles.subtaskChipText}>{item}</Text>
        <TouchableOpacity onPress={() => removeSubtaskItem(idx)} style={{ marginLeft: 4 }}>
          <Ionicons name="close-circle" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    ))}
  </>
);

interface RecurrenceProps {
  recType: Task['recurrence_type'];
  setRecType: (t: Task['recurrence_type']) => void;
  recInterval: number;
  setRecInterval: (i: number) => void;
  recDays: number[];
  toggleDay: (d: number) => void;
  recMonth: number | null;
  setRecMonth: (m: number | null) => void;
  setRecDays: (d: number[]) => void;
}
const AdvancedRecurrencePicker = ({ recType, setRecType, recInterval, setRecInterval, recDays, toggleDay, recMonth, setRecMonth, setRecDays }: RecurrenceProps) => (
  <View style={{ gap: 12 }}>
    <Text style={styles.label}>Tipo de Recorrência *</Text>
    <View style={styles.segmentGroup}>
      {(['daily', 'weekly', 'monthly', 'yearly'] as Task['recurrence_type'][]).map(t => (
        <TouchableOpacity
          key={t}
          style={[styles.segment, recType === t && { backgroundColor: Colors.primary }]}
          onPress={() => setRecType(t)}
        >
          <Text style={[styles.segmentText, recType === t && { color: '#fff' }]}>{recurrenceLabel[t]}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {(recType === 'daily' || recType === 'weekly') && (
      <View>
        <Text style={styles.label}>Frequência *</Text>
        <View style={styles.segmentGroup}>
          {[1, 2, 3].map(i => (
            <TouchableOpacity
              key={i}
              style={[styles.segment, recInterval === i && { backgroundColor: Colors.primary }]}
              onPress={() => setRecInterval(i)}
            >
              <Text style={[styles.segmentText, recInterval === i && { color: '#fff' }]}>
                {i === 1 ? 'Todo(a)' : `A cada ${i}`} {recType === 'daily' ? 'Dia' : 'Semana'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )}

    {recType === 'weekly' && (
      <View>
        <Text style={styles.label}>Dias da Semana *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {weekDays.map((day, idx) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, recDays.includes(idx) && styles.dayChipActive]}
              onPress={() => toggleDay(idx)}
            >
              <Text style={[styles.dayChipText, recDays.includes(idx) && { color: '#fff' }]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )}

    {recType === 'monthly' && (
      <View>
        <Text style={styles.label}>Dias do Mês *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[1, 5, 10, 15, 20, 25, 30].map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, recDays.includes(d) && styles.dayChipActive]}
              onPress={() => toggleDay(d)}
            >
              <Text style={[styles.dayChipText, recDays.includes(d) && { color: '#fff' }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )}

    {recType === 'yearly' && (
      <View>
         <Text style={styles.label}>Mês *</Text>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {months.map((m, idx) => (
              <TouchableOpacity
                key={m}
                style={[styles.dayChip, recMonth === (idx + 1) && styles.dayChipActive, { paddingHorizontal: 15 }]}
                onPress={() => setRecMonth(idx + 1)}
              >
                <Text style={[styles.dayChipText, recMonth === (idx + 1) && { color: '#fff' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
         </ScrollView>
         <Text style={styles.label}>Dia *</Text>
         <TextInput 
          style={styles.input} 
          value={recDays[0]?.toString() || ''} 
          onChangeText={(v) => {
            const d = parseInt(v);
            if (isNaN(d)) setRecDays([]);
            else setRecDays([d]);
          }}
          placeholder="Ex: 25"
          keyboardType="numeric"
        />
      </View>
    )}
  </View>
);

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
  scroll: { padding: Spacing.md, paddingBottom: 100 }, // Added padding for bottom bar
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
  assignedText: { ...Typography.caption, color: Colors.primary, marginTop: 4, fontWeight: 'bold' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  subtaskAddBtn: {
    backgroundColor: Colors.taskMandatory, width: 40, height: 40,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  subtaskChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    paddingVertical: 8, paddingHorizontal: 10, marginBottom: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  subtaskChipText: { ...Typography.body, flex: 1, fontSize: 13 },
  dayChip: { 
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.sm, 
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background 
  },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { ...Typography.captionBold, color: Colors.textSecondary },
});
