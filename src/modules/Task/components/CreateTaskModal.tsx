import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, useColorScheme } from 'react-native';
import { Icon } from 'react-native-paper';
import { Task, TaskInstruction } from '../../../types/TaskInstruction';
import { InstructionEditor } from './InstructionEditor';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'>, id?: string) => void;
  editTask?: Task | null;
}

export function CreateTaskModal({ visible, onClose, onSave, editTask }: CreateTaskModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly' | 'once'>('daily');
  const [instruction, setInstruction] = useState<TaskInstruction[]>([]);
  const [isInstructionEditorVisible, setInstructionEditorVisible] = useState(false);
  const isDark = useColorScheme() === 'dark';

  const c = {
    bg: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    secondary: isDark ? '#888888' : '#999999',
    separator: isDark ? '#333333' : '#EEEEEE',
    primary: isDark ? '#4FC3F7' : '#1A73E8',
    inputBg: isDark ? '#2C2C2C' : '#F5F5F5',
  };

  useEffect(() => {
    if (editTask) {
      setName(editTask.name || '');
      setDescription(editTask.description || '');
      setTime(editTask.time);
      setType(editTask.type);
      setInstruction(editTask.instruction || []);
    } else {
      resetForm();
    }
  }, [editTask, visible]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('错误', '请输入任务标题'); return; }
    if (!time.trim()) { Alert.alert('错误', '请输入执行时间'); return; }
    const taskData: Omit<Task, 'id'> = {
      name: name.trim(), description: description.trim(), time: time.trim(), type,
      status: editTask ? editTask.status : 'stopped', enabled: editTask ? editTask.enabled : false, instruction,
    };
    onSave(taskData, editTask?.id);
    resetForm();
    onClose();
  };

  const resetForm = () => { setName(''); setDescription(''); setTime(''); setType('daily'); setInstruction([]); };
  const handleCancel = () => { resetForm(); onClose(); };

  const typeOptions = [
    { value: 'daily' as const, label: '每日' },
    { value: 'weekly' as const, label: '每周' },
    { value: 'monthly' as const, label: '每月' },
    { value: 'once' as const, label: '一次' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: c.bg }]}>
          <View style={[styles.header, { borderBottomColor: c.separator }]}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={[styles.headerButton, { color: c.secondary }]}>取消</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: c.text }]}>{editTask ? '修改任务' : '新任务'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={!name.trim() || !time.trim()}>
              <Text style={[styles.headerButton, { color: (!name.trim() || !time.trim()) ? c.secondary : c.primary }]}>保存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.secondary }]}>基本信息</Text>
              <View style={[styles.card, { backgroundColor: c.bg }]}>
                <View style={[styles.inputRow, { borderBottomColor: c.separator }]}>
                  <Text style={[styles.inputLabel, { color: c.text }]}>标题</Text>
                  <TextInput style={[styles.input, { color: c.text }]} value={name} onChangeText={setName} placeholder="请输入任务标题" placeholderTextColor={c.secondary} maxLength={50} />
                </View>
                <View style={[styles.inputRow, { borderBottomColor: c.separator }]}>
                  <Text style={[styles.inputLabel, { color: c.text }]}>描述</Text>
                  <TextInput style={[styles.input, { color: c.text }]} value={description} onChangeText={setDescription} placeholder="可选" placeholderTextColor={c.secondary} maxLength={200} />
                </View>
                <View style={styles.inputRow}>
                  <Text style={[styles.inputLabel, { color: c.text }]}>时间</Text>
                  <TextInput style={[styles.input, { color: c.text }]} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor={c.secondary} maxLength={5} />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.secondary }]}>任务类型</Text>
              <View style={[styles.card, { backgroundColor: c.bg }]}>
                <View style={styles.typeContainer}>
                  {typeOptions.map((option) => (
                    <TouchableOpacity key={option.value}
                      style={[styles.typeButton, { borderColor: c.separator }, type === option.value && { backgroundColor: c.primary, borderColor: c.primary }]}
                      onPress={() => setType(option.value)}>
                      <Text style={[styles.typeButtonText, { color: type === option.value ? '#FFF' : c.text }]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.secondary }]}>任务指令</Text>
              <TouchableOpacity style={[styles.card, { backgroundColor: c.bg }]} onPress={() => setInstructionEditorVisible(true)}>
                <View style={styles.instructionRow}>
                  <View>
                    <Text style={[styles.instructionTitle, { color: c.text }]}>指令序列</Text>
                    <Text style={[styles.instructionCount, { color: c.secondary }]}>{instruction.length} 个指令</Text>
                  </View>
                  <Icon source="chevron-right" size={20} color={c.secondary} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <InstructionEditor visible={isInstructionEditorVisible} onClose={() => setInstructionEditorVisible(false)} onSave={(newInstructions) => setInstruction(newInstructions)} initialInstructions={instruction} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  headerButton: { fontSize: 15, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  scrollView: { paddingBottom: 40 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 16 },
  card: { borderRadius: 16, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  inputLabel: { fontSize: 15, width: 56 },
  input: { flex: 1, fontSize: 15, textAlign: 'right' },
  typeContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  typeButton: { flex: 1, paddingVertical: 10, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  typeButtonText: { fontSize: 14, fontWeight: '500' },
  instructionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  instructionTitle: { fontSize: 15, fontWeight: '500' },
  instructionCount: { fontSize: 12, marginTop: 2 },
});
