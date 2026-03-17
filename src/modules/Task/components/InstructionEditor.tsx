import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Button, Icon } from 'react-native-paper';
import { Task, TaskInstruction, COMMON_INSTRUCTION_TEMPLATES } from '../../../types/TaskInstruction';

interface InstructionEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (instructions: TaskInstruction[]) => void;
  task?: Task | null;
  initialInstructions?: TaskInstruction[];
}

export const InstructionEditor: React.FC<InstructionEditorProps> = ({
  visible,
  onClose,
  onSave,
  task,
  initialInstructions = [],
}) => {
  const [instructionJson, setInstructionJson] = useState('');

  useEffect(() => {
    if (visible && initialInstructions.length > 0) {
      setInstructionJson(JSON.stringify(initialInstructions, null, 2));
    } else if (visible) {
      setInstructionJson('');
    }
  }, [visible, initialInstructions]);

  const handleSaveInstruction = () => {
    try {
      const instructions = JSON.parse(instructionJson) as TaskInstruction[];
      onSave(instructions);
      onClose();
    } catch (error) {
      console.error('Invalid JSON:', error);
      // 这里可以添加错误提示
    }
  };

  const handleAddInstructionTemplate = (template: any) => {
    try {
      const newInstruction: TaskInstruction = {
        id: Date.now().toString(),
        type: template.type,
        config: template.config,
      };
      
      const currentInstructions = instructionJson 
        ? JSON.parse(instructionJson) as TaskInstruction[]
        : [];
      
      const updatedInstructions = [...currentInstructions, newInstruction];
      setInstructionJson(JSON.stringify(updatedInstructions, null, 2));
    } catch (error) {
      console.error('Error adding template:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {task ? `编辑任务指令 - ${task.title}` : '新增任务指令'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Icon source="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.instructionEditorContainer}>
          <Text style={styles.sectionTitle}>指令模板</Text>
          <ScrollView horizontal style={styles.templateContainer}>
            {COMMON_INSTRUCTION_TEMPLATES.map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateItem}
                onPress={() => handleAddInstructionTemplate(template)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>指令JSON</Text>
          <TextInput
            mode="outlined"
            multiline
            value={instructionJson}
            onChangeText={setInstructionJson}
            style={styles.jsonInput}
            placeholder="输入任务指令JSON..."
            contentStyle={{ fontFamily: 'monospace' }}
          />

          <Text style={styles.sectionTitle}>指令说明</Text>
          <View style={styles.instructionHelp}>
            <Text style={styles.helpText}>
              • launch_app: 启动应用 (packageName: 包名)
            </Text>
            <Text style={styles.helpText}>
              • click: 点击操作 (target: 目标位置)
            </Text>
            <Text style={styles.helpText}>
              • swipe: 滑动操作 (direction: 方向)
            </Text>
            <Text style={styles.helpText}>
              • input_text: 输入文本 (text: 输入内容)
            </Text>
            <Text style={styles.helpText}>
              • wait: 等待 (duration: 毫秒数)
            </Text>
            <Text style={styles.helpText}>
              • log: 日志 (level: 级别, message: 消息)
            </Text>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.cancelButton}
          >
            取消
          </Button>
          <Button
            mode="contained"
            onPress={handleSaveInstruction}
            style={styles.saveButton}
          >
            保存
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  instructionEditorContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  templateContainer: {
    marginBottom: 16,
  },
  templateItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 10,
    color: '#666',
    lineHeight: 14,
  },
  jsonInput: {
    height: 120,
    fontSize: 12,
    backgroundColor: '#f8f9fa',
    fontFamily: 'monospace',
  },
  instructionHelp: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
});