import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Button, Icon, Card, IconButton, Divider, SegmentedButtons } from 'react-native-paper';
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
  const [instructions, setInstructions] = useState<TaskInstruction[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setInstructions(initialInstructions.length > 0 ? [...initialInstructions] : []);
    }
  }, [visible, initialInstructions]);

  const handleSave = () => {
    onSave(instructions);
    onClose();
  };

  const addInstruction = (template: any) => {
    const newInstruction = {
      ...JSON.parse(JSON.stringify(template.instruction)),
      id: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    setInstructions([...instructions, newInstruction]);
  };

  const removeInstruction = (index: number) => {
    const newInstructions = [...instructions];
    newInstructions.splice(index, 1);
    setInstructions(newInstructions);
  };

  const moveInstruction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === instructions.length - 1)
    ) {
      return;
    }
    const newInstructions = [...instructions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newInstructions[index], newInstructions[targetIndex]] = [
      newInstructions[targetIndex],
      newInstructions[index],
    ];
    setInstructions(newInstructions);
  };

  const updateInstructionParameters = (index: number, params: any) => {
    const newInstructions = [...instructions];
    newInstructions[index] = {
      ...newInstructions[index],
      parameters: {
        ...(newInstructions[index].parameters || {}),
        ...params
      }
    } as TaskInstruction;
    setInstructions(newInstructions);
  };

  const renderInstructionItem = (item: TaskInstruction, index: number) => {
    const isEditing = editingIndex === index;

    return (
      <Card key={item.id} style={styles.instructionCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{item.type.toUpperCase()}</Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                icon="chevron-up"
                size={20}
                onPress={() => moveInstruction(index, 'up')}
                disabled={index === 0}
              />
              <IconButton
                icon="chevron-down"
                size={20}
                onPress={() => moveInstruction(index, 'down')}
                disabled={index === instructions.length - 1}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#FF5252"
                onPress={() => removeInstruction(index)}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.summaryContainer}
            onPress={() => setEditingIndex(isEditing ? null : index)}
          >
            <Text style={styles.instructionSummary}>
              {getInstructionSummary(item)}
            </Text>
            <Icon source={isEditing ? "chevron-up" : "chevron-down"} size={20} color="#666" />
          </TouchableOpacity>

          {isEditing && (
            <View style={styles.editForm}>
              <Divider style={styles.formDivider} />
              {renderParameterEditor(item, index)}
              
              <View style={styles.commonParams}>
                <Text style={styles.paramLabel}>延迟执行 (ms)</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={item.delay?.toString() || '0'}
                  onChangeText={(val) => {
                    const newInstructions = [...instructions];
                    newInstructions[index] = { ...item, delay: parseInt(val) || 0 };
                    setInstructions(newInstructions);
                  }}
                />
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderParameterEditor = (item: TaskInstruction, index: number) => {
    switch (item.type) {
      case 'launch_app':
      case 'close_app':
        return (
          <View>
            <Text style={styles.paramLabel}>应用包名</Text>
            <TextInput
              style={styles.paramInput}
              value={item.parameters.packageName}
              onChangeText={(val) => updateInstructionParameters(index, { packageName: val })}
              placeholder="com.example.app"
            />
            <Text style={styles.paramLabel}>用户 ID (可选)</Text>
            <TextInput
              style={styles.paramInput}
              keyboardType="numeric"
              value={item.parameters.userId?.toString() || '0'}
              onChangeText={(val) => updateInstructionParameters(index, { userId: parseInt(val) || 0 })}
            />
          </View>
        );
      case 'click':
        return (
          <View>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.paramLabel}>坐标 X</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={item.parameters.x.toString()}
                  onChangeText={(val) => updateInstructionParameters(index, { x: parseInt(val) || 0 })}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.paramLabel}>坐标 Y</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={item.parameters.y.toString()}
                  onChangeText={(val) => updateInstructionParameters(index, { y: parseInt(val) || 0 })}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.paramLabel}>长按</Text>
                <TouchableOpacity 
                  style={[styles.miniBtn, item.parameters.longPress && styles.miniBtnActive]}
                  onPress={() => updateInstructionParameters(index, { longPress: !item.parameters.longPress })}
                >
                  <Text style={[styles.miniBtnText, item.parameters.longPress && styles.miniBtnTextActive]}>
                    {item.parameters.longPress ? '是' : '否'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.paramLabel}>点击时长 (ms)</Text>
                <TextInput
                  style={styles.paramInput}
                  keyboardType="numeric"
                  value={item.parameters.duration?.toString() || '100'}
                  onChangeText={(val) => updateInstructionParameters(index, { duration: parseInt(val) || 0 })}
                />
              </View>
            </View>
          </View>
        );
      case 'swipe':
        return (
          <View>
            <Text style={styles.paramLabel}>滑动方向</Text>
            <SegmentedButtons
              value={item.parameters.direction}
              onValueChange={(val) => updateInstructionParameters(index, { direction: val })}
              buttons={[
                { value: 'up', label: '上' },
                { value: 'down', label: '下' },
                { value: 'left', label: '左' },
                { value: 'right', label: '右' },
              ]}
              style={styles.segmented}
            />
            <Text style={styles.paramLabel}>持续时间 (ms)</Text>
            <TextInput
              style={styles.paramInput}
              keyboardType="numeric"
              value={item.parameters.duration?.toString() || '300'}
              onChangeText={(val) => updateInstructionParameters(index, { duration: parseInt(val) || 0 })}
            />
          </View>
        );
      case 'wait':
        return (
          <View>
            <Text style={styles.paramLabel}>等待时长 (ms)</Text>
            <TextInput
              style={styles.paramInput}
              keyboardType="numeric"
              value={item.parameters.duration.toString()}
              onChangeText={(val) => updateInstructionParameters(index, { duration: parseInt(val) || 0 })}
            />
          </View>
        );
      default:
        return <Text style={styles.noParams}>该指令无需额外参数</Text>;
    }
  };

  const getInstructionSummary = (item: TaskInstruction) => {
    switch (item.type) {
      case 'wake_up': return '唤醒设备屏幕';
      case 'launch_app': return `启动应用: ${item.parameters.packageName}`;
      case 'close_app': return `关闭应用: ${item.parameters.packageName}`;
      case 'click': return `点击坐标 (${item.parameters.x}, ${item.parameters.y})${item.parameters.longPress ? ' [长按]' : ''}`;
      case 'swipe': return `向${{up:'上',down:'下',left:'左',right:'右'}[item.parameters.direction]}滑动`;
      case 'wait': return `等待 ${item.parameters.duration}ms`;
      default: return '未知指令';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {task ? `编辑任务指令 - ${task.title}` : '任务指令编辑'}
          </Text>
          <IconButton icon="close" size={24} onPress={onClose} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>指令库</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateList}>
            {COMMON_INSTRUCTION_TEMPLATES.map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => addInstruction(template)}
              >
                <View style={styles.templateIcon}>
                  <Icon source={getIconForType(template.instruction.type)} size={20} color="#4F46E5" />
                </View>
                <Text style={styles.templateName}>{template.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.instructionHeader}>
            <Text style={styles.sectionTitle}>指令序列 ({instructions.length})</Text>
            {instructions.length > 0 && (
              <TouchableOpacity onPress={() => setInstructions([])}>
                <Text style={styles.clearText}>清空</Text>
              </TouchableOpacity>
            )}
          </View>

          {instructions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon source="playlist-plus" size={48} color="#ccc" />
              <Text style={styles.emptyText}>还没有添加指令，点击上方指令库添加</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {instructions.map((item, index) => renderInstructionItem(item, index))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button mode="outlined" onPress={onClose} style={styles.footerBtn}>取消</Button>
          <Button mode="contained" onPress={handleSave} style={[styles.footerBtn, styles.saveBtn]}>保存指令</Button>
        </View>
      </View>
    </Modal>
  );
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'wake_up': return 'power';
    case 'launch_app': return 'rocket-launch';
    case 'close_app': return 'close-circle';
    case 'click': return 'gesture-tap';
    case 'swipe': return 'gesture-swipe';
    case 'wait': return 'clock-outline';
    default: return 'help-circle';
  }
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  templateList: { marginBottom: 24, flexDirection: 'row' },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 100,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: { fontSize: 12, color: '#444', textAlign: 'center', fontWeight: '500' },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearText: { color: '#FF5252', fontSize: 14 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { color: '#999', marginTop: 12, textAlign: 'center' },
  list: { paddingBottom: 20 },
  instructionCard: { marginBottom: 12, borderRadius: 12, elevation: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  instructionSummary: { fontSize: 15, color: '#333', flex: 1, marginRight: 8 },
  editForm: { marginTop: 8 },
  formDivider: { marginVertical: 12 },
  paramLabel: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 10 },
  paramInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  rowAlignCenter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  miniBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  miniBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  miniBtnText: { fontSize: 12, color: '#666' },
  miniBtnTextActive: { color: '#fff' },
  segmented: { marginVertical: 8 },
  noParams: { color: '#999', fontStyle: 'italic', paddingVertical: 10 },
  commonParams: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerBtn: { flex: 1, marginHorizontal: 4 },
  saveBtn: { backgroundColor: '#4F46E5' },
});