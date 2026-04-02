import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, EmptyState, ProgressBar, SectionHeader } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../utils/theme';
import { getChildName } from '../../utils/helpers';
import api from '../../services/api';

let BarChart: any = null;
if (Platform.OS !== 'web') {
  BarChart = require('react-native-gifted-charts').BarChart;
}

interface Child {
  id: string;
  name: string;
  base_allowance: string | number;
}

interface ReportData {
  baseAllowance: number;
  finalAllowance: number;
  breakdown: {
    bonusesFromTasks: number;
    penaltiesFromTasks: number;
    penaltiesFromMissedMandatory: number;
  };
  executions: any[];
}

interface HistoryData {
  month: string;
  baseAllowance: number;
  finalAllowance: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthlyReportScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchInitial = async () => {
        try {
          const res = await api.get('/children');
          if (active) {
            setChildren(res.data);
            if (res.data.length > 0 && !selectedChild) {
              setSelectedChild(res.data[0]);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchInitial();
      return () => { active = false; };
    }, [selectedChild])
  );

  const loadReport = useCallback(async () => {
    if (!selectedChild) return;
    setLoading(true);
    setReport(null);
    setHistory([]);
    try {
      const [repRes, histRes] = await Promise.all([
        api.get(`/adjustments/monthly?childId=${selectedChild.id}&month=${selectedMonth}`),
        api.get(`/adjustments/history?childId=${selectedChild.id}&limit=6`)
      ]);
      setReport(repRes.data);
      setHistory(histRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedChild, selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport])
  );

  const monthLabel = (() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  })();

  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const Row = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, color ? { color } : {}]}>
        {value >= 0 ? '+' : ''}R$ {value.toFixed(2)}
      </Text>
    </View>
  );

  const ExpandableGroup = ({ title, total, items, color }: { title: string; total: number; items: any[]; color: string }) => {
    const [expanded, setExpanded] = useState(false);
    if (items.length === 0) return null;

    return (
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <TouchableOpacity 
          style={[styles.groupHeader, { borderLeftWidth: 4, borderLeftColor: color }]} 
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.groupTitle}>{title}</Text>
            <Text style={[styles.groupTotal, { color: total >= 0 ? Colors.success : Colors.danger }]}>
              Acumulado: {total >= 0 ? '+' : ''}R$ {total.toFixed(2)}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.groupContent}>
            {items.map((ex) => {
              const isBonus = ex.assignment?.task?.type === 'bonus';
              const isPenalty = ex.assignment?.task?.type === 'penalty';
              const isMandatory = ex.assignment?.task?.type === 'mandatory';
              const taskValue = Number(ex.assignment?.task?.value || 0);
              
              let effect = '';
              if (isBonus && ex.status === 'approved') {
                effect = `+R$ ${taskValue.toFixed(2)}`;
              } else if (isPenalty && ex.status === 'approved') {
                effect = `-R$ ${taskValue.toFixed(2)}`;
              } else if (isMandatory) {
                const today = new Date();
                const midnightToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
                const taskDate = new Date(ex.date);
                if (ex.status === 'rejected' || taskDate < midnightToday) {
                  effect = `-R$ ${taskValue.toFixed(2)}`;
                }
              }

              return (
                <View key={ex.id} style={styles.execItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.execName}>{ex.assignment?.task?.name}</Text>
                    <Text style={styles.execDate}>{new Date(ex.date).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Badge
                      label={ex.status === 'approved' ? 'Aprovada' : ex.status === 'completed' ? 'Concluída' : ex.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                      color={ex.status === 'approved' ? Colors.success : ex.status === 'rejected' ? Colors.danger : Colors.warning}
                    />
                    {effect !== '' && (
                      <Text style={[styles.execValue, { color: effect.startsWith('+') ? Colors.success : Colors.danger }]}>
                        {effect}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    );
  };

  const chartData = history.map(h => {
    const [y, m] = h.month.split('-');
    const label = MONTHS[Number(m)-1].substring(0,3);
    return {
      value: h.finalAllowance,
      label,
      frontColor: h.month === selectedMonth ? Colors.secondary : Colors.primary,
      topLabelComponent: () => <Text style={{fontSize: 10, color: Colors.textSecondary, marginBottom: 4}}>{h.finalAllowance.toFixed(0)}</Text>
    };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relatório Mensal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Child picker */}
        {children.length > 0 && (
          <>
            <SectionHeader title="Criança" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childChip, selectedChild?.id === child.id && styles.childChipActive]}
                  onPress={() => setSelectedChild(child)}
                >
                  <Text style={[styles.childChipText, selectedChild?.id === child.id && styles.childChipTextActive]}>
                    {getChildName(child.name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Month picker */}
        <SectionHeader title="Mês" />
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: Spacing.xl }} color={Colors.primary} />}

        {!loading && children.length === 0 && (
          <EmptyState emoji="👨‍👩‍👧" title="Cadastre uma criança" subtitle="Adicione crianças para ver o relatório." />
        )}

        {!loading && children.length > 0 && !selectedChild && (
          <EmptyState emoji="📊" title="Selecione uma criança" subtitle="Toque em uma criança acima para ver o relatório." />
        )}

        {!loading && children.length > 0 && selectedChild && (!report || history.length === 0) && (
          <EmptyState emoji="📊" title="Sem dados" subtitle="Nenhum dado encontrado para este período." />
        )}

        {!loading && report && history.length > 0 && (
          <>
            {/* Histórico Financeiro */}
            <SectionHeader title="Evolução Financeira (Últimos 6 meses)" />
            {Platform.OS === 'web' ? (
              <Card style={{ marginBottom: Spacing.lg, paddingVertical: Spacing.lg, alignItems: 'center' }}>
                <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>
                  [Visualização de gráfico indisponível na Web, utilize o app móvel]
                </Text>
              </Card>
            ) : (
              <Card style={{ marginBottom: Spacing.lg, paddingVertical: Spacing.lg, paddingLeft: 0, paddingRight: Spacing.sm, alignItems: 'center' }}>
                <BarChart
                  data={chartData}
                  barWidth={28}
                  spacing={24}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 11 }}
                  noOfSections={4}
                  height={160}
                  initialSpacing={10}
                  rulesColor="rgba(255,255,255,0.05)"
                  showLine={false}
                />
              </Card>
            )}

            {/* Final allowance hero */}
            <Card style={styles.heroCard}>
              <Text style={styles.heroLabel}>Mesada Final ({monthLabel})</Text>
              <Text style={styles.heroValue}>R$ {report.finalAllowance.toFixed(2)}</Text>
              <ProgressBar
                progress={report.baseAllowance > 0 ? Math.min(report.finalAllowance / report.baseAllowance, 1) : 0}
                color={Colors.success}
                style={{ marginTop: Spacing.sm }}
              />
            </Card>

            {/* Breakdown */}
            <SectionHeader title="Detalhamento" />
            <Card>
              <Row label="Mesada Base" value={report.baseAllowance} />
              <View style={styles.divider} />
              <Row label="Bônus de Tarefas" value={report.breakdown.bonusesFromTasks} color={Colors.success} />
              <Row label="Penalidades de Tarefas" value={-report.breakdown.penaltiesFromTasks} color={Colors.danger} />
              <Row label="Faltas em Obrigatórias" value={-report.breakdown.penaltiesFromMissedMandatory} color={Colors.danger} />
              <View style={styles.divider} />
              <Row label="Total Final" value={report.finalAllowance} color={Colors.primary} />
            </Card>

            {/* Executions summary */}
            <SectionHeader title="Ocorrências do Mês" />
            
            {report.executions.length === 0 ? (
              <EmptyState emoji="📝" title="Sem atividades registradas" />
            ) : (() => {
              const mandatories = report.executions.filter(ex => ex.assignment?.task?.type === 'mandatory');
              const bonuses = report.executions.filter(ex => ex.assignment?.task?.type === 'bonus');
              const penalties = report.executions.filter(ex => ex.assignment?.task?.type === 'penalty');

              return (
                <View style={{ gap: Spacing.sm }}>
                  <ExpandableGroup 
                    title="⚠️ Tarefas Obrigatórias" 
                    total={-report.breakdown.penaltiesFromMissedMandatory}
                    items={mandatories}
                    color={Colors.taskMandatory}
                  />
                  <ExpandableGroup 
                    title="✨ Oportunidades (Bônus)" 
                    total={report.breakdown.bonusesFromTasks}
                    items={bonuses}
                    color={Colors.taskBonus}
                  />
                  <ExpandableGroup 
                    title="🚫 Penalidades Aplicadas" 
                    total={-report.breakdown.penaltiesFromTasks}
                    items={penalties}
                    color={Colors.taskPenalty}
                  />
                </View>
              );
            })()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h2 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  childChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
    marginRight: Spacing.sm,
  },
  childChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  childChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  childChipTextActive: { color: '#fff' },
  monthPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  monthArrow: { padding: 4 },
  monthLabel: { ...Typography.bodyBold },
  heroCard: { backgroundColor: Colors.primary, marginBottom: Spacing.md },
  heroLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  heroValue: { fontSize: 38, fontWeight: '900', color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { ...Typography.body, color: Colors.textSecondary },
  rowValue: { ...Typography.bodyBold },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  execCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  execName: { ...Typography.bodyBold, fontSize: 13, color: Colors.textPrimary },
  execDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  execValue: { ...Typography.bodyBold, fontSize: 13, marginTop: 4 },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.card,
  },
  groupTitle: { ...Typography.bodyBold, fontSize: 15 },
  groupTotal: { ...Typography.captionBold, marginTop: 2 },
  groupContent: {
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  execItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
