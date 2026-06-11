import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Icon } from 'react-native-paper';
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
  const isDark = useColorScheme() === 'dark';

  const c = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    secondary: isDark ? '#888888' : '#999999',
    separator: isDark ? '#333333' : '#EEEEEE',
    primary: isDark ? '#4FC3F7' : '#1A73E8',
    destructive: isDark ? '#FF6B6B' : '#F44336',
    inputBg: isDark ? '#2C2C2C' : '#F5F5F5',
  };

  useEffect(() => {
    if (visible) setInstructions(initialInstructions.length > 0 ? [...initialInstructions] : []);
  }, [visible, initialInstructions]);

  const handleSave = () => { onSave(instructions); onClose(); };

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
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === instructions.length - 1)) return;
    const newInstructions = [...instructions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newInstructions[index], newInstructions[targetIndex]] = [newInstructions[targetIndex], newInstructions[index]];
    setInstructions(newInstructions);
  };

  const updateInstructionParameters = (index: number, params: any) => {
    const newInstructions = [...instructions];
    newInstructions[index] = { ...newInstructions[index], parameters: { ...(newInstructions[index].parameters || {}), ...params } } as TaskInstruction;
    setInstructions(newInstructions);
  };

  const renderInstructionItem = (item: TaskInstruction, index: number) => {
    const isEditing = editingIndex === index;
    return (
      <View key={item.id} style={[styles.instructionCard, { backgroundColor: c.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.moveButtons}>
              <TouchableOpacity onPress={() => moveInstruction(index, 'up')} disabled={index === 0} style={styles.moveBtn}>
                <Icon source="chevron-up" size={18} color={index === 0 ? c.secondary : c.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => moveInstruction(index, 'down')} disabled={index === instructions.length - 1} style={styles.moveBtn}>
                <Icon source="chevron-down" size={18} color={index === instructions.length - 1 ? c.secondary : c.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: c.primary + '15' }]}>
              <Text style={[styles.typeBadgeText, { color: c.primary }]}>{item.type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.summaryContainer} onPress={() => setEditingIndex(isEditing ? null : index)}>
              <Text style={[styles.instructionSummary, { color: c.text }]} numberOfLines={1}>{getInstructionSummary(item)}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => removeInstruction(index)} style={styles.deleteBtn}>
            <Icon source="close-circle" size={22} color={c.destructive} />
          </TouchableOpacity>
        </View>

        {isEditing && (
          <View style={[styles.editForm, { borderTopColor: c.separator }]}>
            {renderParameterEditor(item, index)}
            <View style={[styles.paramRow, { borderTopColor: c.separator }]}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>延迟 (ms)</Text>
              <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} keyboardType="numeric" value={item.delay?.toString() || '0'} onChangeText={(val) => {
                const newInstructions = [...instructions]; newInstructions[index] = { ...item, delay: parseInt(val) || 0 }; setInstructions(newInstructions);
              }} />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderParameterEditor = (item: TaskInstruction, index: number) => {
    switch (item.type) {
      case 'launch_app':
      case 'close_app':
        return (
          <View>
            <View style={[styles.paramRow, { borderBottomColor: c.separator }]}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>包名</Text>
              <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} value={item.parameters.packageName} onChangeText={(val) => updateInstructionParameters(index, { packageName: val })} placeholder="com.example.app" placeholderTextColor={c.secondary} />
            </View>
            <View style={[styles.paramRow, { borderBottomColor: c.separator }]}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>用户 ID</Text>
              <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} keyboardType="numeric" value={item.parameters.userId?.toString() || '0'} onChangeText={(val) => updateInstructionParameters(index, { userId: parseInt(val) || 0 })} />
            </View>
          </View>
        );
      case 'click':
        return (
          <View>
            <View style={[styles.paramRow, { borderBottomColor: c.separator }]}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>X 坐标</Text>
              <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} keyboardType="numeric" value={item.parameters.x.toString()} onChangeText={(val) => updateInstructionParameters(index, { x: parseInt(val) || 0 })} />
            </View>
            <View style={[styles.paramRow, { borderBottomColor: c.separator }]}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>Y 坐标</Text>
              <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} keyboardType="numeric" value={item.parameters.y.toString()} onChangeText={(val) => updateInstructionParameters(index, { y: parseInt(val) || 0 })} />
            </View>
            <View style={[styles.paramRow, { borderBottomColor: c.separator }]}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>长按</Text>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: item.parameters.longPress ? c.primary : c.inputBg, borderColor: item.parameters.longPress ? c.primary : c.separator }]} onPress={() => updateInstructionParameters(index, { longPress: !item.parameters.longPress })}>
                <Text style={[styles.toggleBtnText, { color: item.parameters.longPress ? '#FFF' : c.text }]}>{item.parameters.longPress ? '是' : '否'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.paramRow}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>时长 (ms)</Text>
              <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} keyboardType="numeric" value={item.parameters.duration?.toString() || '100'} onChangeText={(val) => updateInstructionParameters(index, { duration: parseInt(val) || 0 })} />
            </View>
          </View>
        );
      case 'swipe':
        return (
          <View>
            <View style={styles.paramRow}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>方向</Text>
              <View style={styles.directionContainer}>
                {['up', 'down', 'left', 'right'].map(dir => (
                  <TouchableOpacity key={dir} style={[styles.directionBtn, { backgroundColor: c.inputBg, borderColor: c.separator }, item.parameters.direction === dir && { backgroundColor: c.primary, borderColor: c.primary }]} onPress={() => updateInstructionParameters(index, { direction: dir })}>
                    <Text style={[styles.directionBtnText, { color: item.parameters.direction === dir ? '#FFF' : c.text }]}>{{up:'上',down:'下',left:'左',right:'右'}[dir as 'up'|'down'|'left'|'right']}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.paramRow, { borderTopColor: c.separator }]}>
              <Text style={[styles.paramLabel, { color: c.secondary }]}>时长 (ms)</Text>
              <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} keyboardType="numeric" value={item.parameters.duration?.toString() || '300'} onChangeText={(val) => updateInstructionParameters(index, { duration: parseInt(val) || 0 })} />
            </View>
          </View>
        );
      case 'wait':
        return (
          <View style={styles.paramRow}>
            <Text style={[styles.paramLabel, { color: c.secondary }]}>时长 (ms)</Text>
            <TextInput style={[styles.paramInput, { color: c.text, backgroundColor: c.inputBg }]} keyboardType="numeric" value={item.parameters.duration.toString()} onChangeText={(val) => updateInstructionParameters(index, { duration: parseInt(val) || 0 })} />
          </View>
        );
      default:
        return <Text style={[styles.noParams, { color: c.secondary }]}>无需参数</Text>;
    }
  };

  const getInstructionSummary = (item: TaskInstruction) => {
    switch (item.type) {
      case 'wake_up': return '唤醒设备屏幕';
      case 'launch_app': return `启动: ${item.parameters.packageName}`;
      case 'close_app': return `关闭: ${item.parameters.packageName}`;
      case 'click': return `点击 (${item.parameters.x}, ${item.parameters.y})`;
      case 'swipe': return `向${{up:'上',down:'下',left:'左',right:'右'}[item.parameters.direction]}滑动`;
      case 'wait': return `等待 ${item.parameters.duration}ms`;
      default: return '未知指令';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: c.bg }]}>
          <View style={[styles.header, { borderBottomColor: c.separator }]}>
            <TouchableOpacity onPress={onClose}><Text style={[styles.headerButton, { color: c.secondary }]}>取消</Text></TouchableOpacity>
            <Text style={[styles.headerTitle, { color: c.text }]}>指令编辑</Text>
            <TouchableOpacity onPress={handleSave}><Text style={[styles.headerButton, { color: c.primary }]}>保存</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={[styles.sectionTitle, { color: c.secondary }]}>指令库</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateList}>
              {COMMON_INSTRUCTION_TEMPLATES.map(template => (
                <TouchableOpacity key={template.id} style={[styles.templateCard, { backgroundColor: c.surface }]} onPress={() => addInstruction(template)}>
                  <View style={[styles.templateIcon, { backgroundColor: c.primary + '15' }]}>
                    <Icon source={getIconForType(template.instruction.type)} size={22} color={c.primary} />
                  </View>
                  <Text style={[styles.templateName, { color: c.text }]} numberOfLines={1}>{template.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.instructionHeader}>
              <Text style={[styles.sectionTitle, { color: c.secondary }]}>指令序列 ({instructions.length})</Text>
              {instructions.length > 0 && <TouchableOpacity onPress={() => setInstructions([])}><Text style={[styles.clearText, { color: c.destructive }]}>清空</Text></TouchableOpacity>}
            </View>

            {instructions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon source="playlist-plus" size={48} color={c.secondary} />
                <Text style={[styles.emptyText, { color: c.secondary }]}>点击上方指令库添加</Text>
              </View>
            ) : (
              <View style={styles.list}>{instructions.map((item, index) => renderInstructionItem(item, index))}</View>
            )}
          </ScrollView>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  headerButton: { fontSize: 15, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  templateList: { marginBottom: 24 },
  templateCard: { borderRadius: 12, padding: 12, marginRight: 10, width: 88, alignItems: 'center' },
  templateIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  templateName: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  instructionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clearText: { fontSize: 14, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, textAlign: 'center', fontSize: 14 },
  list: { paddingBottom: 20 },
  instructionCard: { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  moveButtons: { marginRight: 8 },
  moveBtn: { padding: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 10 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  summaryContainer: { flex: 1 },
  instructionSummary: { fontSize: 14 },
  deleteBtn: { padding: 4 },
  editForm: { borderTopWidth: 0.5, padding: 12 },
  paramRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 0.5 },
  paramLabel: { fontSize: 14, width: 72 },
  paramInput: { flex: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  toggleBtnText: { fontSize: 14, fontWeight: '500' },
  directionContainer: { flexDirection: 'row', gap: 8, flex: 1 },
  directionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  directionBtnText: { fontSize: 13, fontWeight: '500' },
  noParams: { fontStyle: 'italic', paddingVertical: 10, paddingHorizontal: 4 },
});
