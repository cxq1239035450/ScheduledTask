import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Modal as PaperModal, Button, Title, Divider } from 'react-native-paper';
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
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [instruction, setInstruction] = useState<TaskInstruction[]>([]);
  const [isInstructionEditorVisible, setInstructionEditorVisible] = useState(false);

  useEffect(() => {
    if (editTask) {
      setName(editTask.name||'');
      setDescription(editTask.description || '');
      setTime(editTask.time);
      setType(editTask.type);
      setInstruction(editTask.instruction || []);
    } else {
      resetForm();
    }
  }, [editTask, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入任务标题');
      return;
    }
    if (!time.trim()) {
      Alert.alert('错误', '请输入执行时间');
      return;
    }

    const taskData: Omit<Task, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      time: time.trim(),
      type,
      status: editTask ? editTask.status : 'stopped',
      enabled: editTask ? editTask.enabled : false,
      instruction,
    };

    onSave(taskData, editTask?.id);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTime('');
    setType('daily');
    setInstruction([]);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <PaperModal
      visible={visible}
      onDismiss={handleCancel}
      contentContainerStyle={styles.modalContainer}
    >
      <Title style={styles.title}>{editTask ? '修改任务' : '创建新任务'}</Title>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>任务标题 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="请输入任务标题"
            maxLength={50}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>任务描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="请输入任务描述（可选）"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>执行时间 *</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="例如：08:30"
            maxLength={5}
          />
          <Text style={styles.hint}>格式：HH:MM</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>任务类型</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'daily' && styles.typeButtonActive]}
              onPress={() => setType('daily')}
            >
              <Text style={[styles.typeButtonText, type === 'daily' && styles.typeButtonTextActive]}>每日</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'weekly' && styles.typeButtonActive]}
              onPress={() => setType('weekly')}
            >
              <Text style={[styles.typeButtonText, type === 'weekly' && styles.typeButtonTextActive]}>每周</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'monthly' && styles.typeButtonActive]}
              onPress={() => setType('monthly')}
            >
              <Text style={[styles.typeButtonText, type === 'monthly' && styles.typeButtonTextActive]}>每月</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>任务指令</Text>
          <View style={styles.instructionSummary}>
            <Text style={styles.instructionCount}>
              {instruction.length} 个指令
            </Text>
            <TouchableOpacity
              style={styles.editInstructionButton}
              onPress={() => setInstructionEditorVisible(true)}
            >
              <Icon source="pencil" size={16} color="white" />
              <Text style={styles.editInstructionText}>编辑指令</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <InstructionEditor
        visible={isInstructionEditorVisible}
        onClose={() => setInstructionEditorVisible(false)}
        onSave={(newInstructions) => setInstruction(newInstructions)}
        initialInstructions={instruction}
      />

      <Divider style={styles.divider} />

      <View style={styles.modalActions}>
        <Button 
          mode="outlined" 
          onPress={handleCancel}
          style={styles.cancelButton}
        >
          取消
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSave}
          style={styles.saveButton}
          disabled={!name.trim() || !time.trim()}
        >
          {editTask ? '保存修改' : '创建任务'}
        </Button>
      </View>
    </PaperModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  typeButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  instructionSummary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionCount: {
    fontSize: 14,
    color: '#666',
  },
  editInstructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 6,
  },
  editInstructionText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 100,
  },
});