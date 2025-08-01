import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';

interface Reminder {
  id: string;
  medicationName: string;
  time: string;
  enabled: boolean;
  days: string[];
}

function ReminderListScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      medicationName: 'Aspirin',
      time: '8:00 AM',
      enabled: true,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      id: '2',
      medicationName: 'Vitamin D',
      time: '9:00 AM',
      enabled: true,
      days: ['Mon', 'Wed', 'Fri'],
    },
  ]);

  const toggleReminder = (id: string) => {
    setReminders(prevReminders =>
      prevReminders.map(reminder =>
        reminder.id === id
          ? {...reminder, enabled: !reminder.enabled}
          : reminder,
      ),
    );
  };

  const renderReminder = ({item}: {item: Reminder}) => (
    <View style={styles.reminderCard}>
      <View style={styles.reminderContent}>
        <Text style={styles.medicationName}>{item.medicationName}</Text>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.days}>{item.days.join(', ')}</Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={() => toggleReminder(item.id)}
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={item.enabled ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reminders}
        renderItem={renderReminder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reminders set yet</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add Reminder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reminderContent: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  days: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReminderListScreen;